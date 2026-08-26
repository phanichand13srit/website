const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter full name'],
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
  },
  phone: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
