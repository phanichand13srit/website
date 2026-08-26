const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Supports guest checkout
  },
  customerName: {
    type: String,
    default: 'Customer',
  },
  customerEmail: {
    type: String,
    default: '',
  },
  customerPhone: {
    type: String,
    default: '',
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: { type: String, required: true },
      qty: { type: Number, required: true, default: 1 },
      price: { type: Number, required: true },
      unit: { type: String, default: '1 kg' },
      image: { type: String },
    }
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  paymentMethod: {
    type: String,
    default: 'Cash on Delivery',
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Confirmed',
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
