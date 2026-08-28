const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  minOrderAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
