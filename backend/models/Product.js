const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter a product name'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    trim: true,
  },
  subcategory: {
    type: String,
    default: '',
    trim: true,
  },
  tags: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: [true, 'Please enter a price'],
    min: 0,
  },
  originalPrice: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    default: '1 kg', // e.g. '1 Litre', '500 g', '250 g', '1 dozen'
  },
  countInStock: {
    type: Number,
    default: 15,
    min: 0,
  },
  brand: {
    type: String,
    default: 'Arshith Fresh',
  },
  image: {
    type: String,
    default: '',
  },
  images: [{
    url: { type: String, default: '' },
    alt: { type: String, default: '' }
  }],
  hoverImage: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 4.9,
  },
  numReviews: {
    type: Number,
    default: 12,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
