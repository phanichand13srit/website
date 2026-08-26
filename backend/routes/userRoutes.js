const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST /api/users/register
// @desc    Register a new customer account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password, // In production, hash with bcryptjs
      phone,
      role: 'customer',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: 'jwt_token_' + user._id,
    });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed', error: error.message });
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user & return account info
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.password === password) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: 'jwt_token_' + user._id,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Login server error', error: error.message });
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
