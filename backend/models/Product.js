const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    trim: true,
  },
  rating: {
    type: Number,
    required: [true, 'Please select a star rating'],
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    default: '',
    trim: true,
  },
  comment: {
    type: String,
    required: [true, 'Please enter review description'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

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
  reviews: [reviewSchema],
  isFeatured: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
