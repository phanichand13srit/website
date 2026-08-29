const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true,
  },
  productName: {
    type: String,
    default: '',
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: [true, 'Star rating is required'],
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: 150,
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: 5,
    maxlength: 2000,
  },
  images: [{
    type: String, // Base64 or Image URL
  }],
  verifiedPurchase: {
    type: Boolean,
    default: false,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  helpfulUsers: [{
    type: String, // user email or IP
  }],
}, {
  timestamps: true,
});

// Index to quickly look up reviews by product and user
reviewSchema.index({ productId: 1, customerEmail: 1 });

module.exports = mongoose.model('Review', reviewSchema);
