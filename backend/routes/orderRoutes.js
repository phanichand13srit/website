const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// @route   GET /api/orders
// @desc    Get all orders (Admin overview)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching orders', error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order details by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('orderItems.product', 'name price image');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving order', error: error.message });
  }
});

const mongoose = require('mongoose');

// @route   POST /api/orders
// @desc    Create a new order (Checkout)
router.post('/', async (req, res) => {
  try {
    const {
      user,
      customerName,
      customerEmail,
      customerPhone,
      orderItems,
      shippingAddress,
      billingAddress,
      transactionId,
      paymentMethod,
      totalPrice,
      itemsPrice,
      shippingPrice,
      isPaid
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    const validUser = (user && mongoose.Types.ObjectId.isValid(user)) ? user : undefined;

    const sanitizedItems = orderItems.map(item => ({
      ...item,
      product: (item.product && mongoose.Types.ObjectId.isValid(item.product)) ? item.product : undefined,
      qty: Number(item.qty || item.quantity || 1),
      price: Number(item.price || 0)
    }));

    const order = new Order({
      user: validUser,
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      orderItems: sanitizedItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      transactionId: transactionId || '',
      paymentMethod: paymentMethod || 'Razorpay Secure',
      itemsPrice: itemsPrice || totalPrice,
      shippingPrice: shippingPrice || 0,
      totalPrice,
      isPaid: isPaid || false,
      status: 'Confirmed',
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error placing order', error: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (e.g. Processing, Shipped, Delivered)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, isPaid, isDelivered } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status) order.status = status;
    if (typeof isPaid === 'boolean') order.isPaid = isPaid;
    if (typeof isDelivered === 'boolean') order.isDelivered = isDelivered;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order status', error: error.message });
  }
});

module.exports = router;
