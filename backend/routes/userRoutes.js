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

// @route   POST /api/users/forgot-password
// @desc    Generate password reset token & link
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

    // Construct local reset URL
    const resetUrl = `http://localhost:5000/pages/auth/reset-password.html?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    console.log(`\n======================================================`);
    console.log(`🔑 PASSWORD RESET LINK GENERATED:`);
    console.log(`User  : ${user.email}`);
    console.log(`Link  : ${resetUrl}`);
    console.log(`======================================================\n`);

    res.json({
      message: 'Password reset link generated successfully!',
      resetUrl,
      email: user.email,
      expiresIn: '1 hour'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating reset token', error: error.message });
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

    // Fetch user's orders by user ID or customer email
    const orders = await Order.find({
      $or: [
        { user: user._id },
        { customerEmail: user.email }
      ]
    }).sort({ createdAt: -1 });

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
        ...(name && { name }),
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

module.exports = router;
