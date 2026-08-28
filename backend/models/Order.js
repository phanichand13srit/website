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
        required: false,
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
    apartment: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, default: 'Karnataka' },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  billingAddress: {
    address: { type: String, default: '' },
    apartment: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'India' },
  },
  transactionId: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    default: 'Razorpay Secure',
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  discountPrice: {
    type: Number,
    default: 0.0,
  },
  couponCode: {
    type: String,
    default: '',
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
    enum: ['Placed', 'Pending', 'Confirmed', 'Processing', 'Dispatched', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Placed',
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  inventoryDeducted: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
