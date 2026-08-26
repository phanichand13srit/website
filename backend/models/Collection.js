const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    lowercase: true,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  subcategories: [{
    type: String,
    trim: true,
  }],
  collectionType: {
    type: String,
    enum: ['manual', 'automated'],
    default: 'manual',
  },
  conditionsSummary: {
    type: String,
    default: 'All Products',
  },
  productsCount: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
