const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Order = require('../models/Order');

// @route   POST /api/users/register
// @desc    Register a new customer account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'customer',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: 'session_' + user._id + '_' + Date.now(),
    });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed', error: error.message });
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user with email & password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.password === password) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        street: user.street,
        city: user.city,
        postalCode: user.postalCode,
        token: 'session_' + user._id + '_' + Date.now(),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Login server error', error: error.message });
  }
});

// @route   POST /api/users/google-auth
// @desc    One-click Google / Gmail sign in & registration
router.post('/google-auth', async (req, res) => {
  try {
    const { email, name, picture, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email from Google is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user automatically from Google Profile
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: crypto.randomBytes(16).toString('hex'), // Random password for OAuth users
        avatar: picture || '',
        googleId: googleId || '',
        role: 'customer'
      });
    } else {
      // Update avatar if provided
      if (picture && !user.avatar) {
        user.avatar = picture;
        await user.save();
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      street: user.street,
      city: user.city,
      postalCode: user.postalCode,
      token: 'session_' + user._id + '_' + Date.now(),
      isGoogleAuth: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication error', error: error.message });
  }
});

const nodemailer = require('nodemailer');

// @route   POST /api/users/forgot-password
// @desc    Generate password reset token, link & send official email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please enter your registered email' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity

    await user.save();

    // Construct reset URL
    const resetUrl = `http://localhost:5000/pages/auth/reset-password.html?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    console.log(`\n======================================================`);
    console.log(`🔑 PASSWORD RESET LINK GENERATED:`);
    console.log(`User  : ${user.email}`);
    console.log(`Link  : ${resetUrl}`);
    console.log(`======================================================\n`);

    // Dispatch Official Email via Nodemailer if credentials configured
    let emailSent = false;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        const mailOptions = {
          from: `"Arshith Fresh" <${emailUser}>`,
          to: user.email,
          subject: '🔑 Reset Your Arshith Fresh Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #0f7139; margin: 0; font-size: 26px;">Arshith Fresh</h1>
                <p style="color: #64748b; margin-top: 4px; font-size: 14px;">100% Pure & Authentic Natural Products</p>
              </div>
              <div style="padding: 24px; background: #f8fafc; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                  Hello <strong>${user.name || 'Valued Customer'}</strong>,<br><br>
                  We received a request to reset the password for your Arshith Fresh account (<strong>${user.email}</strong>).
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetUrl}" style="background: #0f7139; color: #ffffff; padding: 12px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(15,113,57,0.3);">
                    🔑 Reset My Password
                  </a>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
                  This link is valid for <strong>60 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
                </p>
              </div>
              <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                © 2025 Arshith Fresh India Pvt. Ltd. Bengaluru, Karnataka, India - 560076
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log(`📧 Official email delivered to ${user.email} via Gmail SMTP!`);
      } catch (err) {
        console.error('Nodemailer delivery error:', err.message);
      }
    }

    res.json({
      success: true,
      message: `A password reset link has been sent to ${user.email}. Please check your email inbox.`,
      email: user.email,
      emailSent,
      expiresIn: '1 hour'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing forgot password request', error: error.message });
  }
});

// @route   POST /api/users/reset-password/:token
// @desc    Verify token & set new password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired. Please request a new link.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: 'Password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// @route   GET /api/users/profile/:id
// @desc    Get user profile with their order history
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch user's orders by user ID or customer email (case-insensitive)
    const emailFilter = user.email ? new RegExp(`^${user.email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') : null;
    const query = {
      $or: [
        { user: user._id },
        ...(emailFilter ? [{ customerEmail: emailFilter }, { customerEmail: user.email }] : [])
      ]
    };
    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.json({
      user,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
});

// @route   PUT /api/users/profile/:id
// @desc    Update user profile details
router.put('/profile/:id', async (req, res) => {
  try {
    const { name, phone, street, city, postalCode, country } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(street !== undefined && { street }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country !== undefined && { country }),
      },
      { new: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error updating profile', error: error.message });
  }
});

// @route   PUT /api/users/change-password/:id
// @desc    Change password from user profile
router.put('/change-password/:id', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin view)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
});

// @route   POST /api/users/bulk-delete
// @desc    Bulk delete users by IDs (Admin)
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of user IDs to delete' });
    }
    const result = await User.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `Successfully deleted ${result.deletedCount} users`, count: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error performing bulk delete', error: error.message });
  }
});

// @route   PUT /api/users/bulk-role
// @desc    Bulk update user roles (Admin)
router.put('/bulk-role', async (req, res) => {
  try {
    const { ids, role } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !role) {
      return res.status(400).json({ message: 'Please provide user IDs and a valid role' });
    }
    const result = await User.updateMany(
      { _id: { $in: ids } },
      { $set: { role } }
    );
    res.json({ success: true, message: `Updated role to ${role} for ${result.modifiedCount} users`, count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user roles', error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete single user (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

module.exports = router;


