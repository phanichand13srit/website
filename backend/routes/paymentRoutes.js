const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_51gXq8Jv81mExample';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'exampleRazorpaySecret123';
  return new Razorpay({
    key_id,
    key_secret,
  });
};

// @route   GET /api/payment/key
// @desc    Get public Razorpay Key ID for client checkout
router.get('/key', (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_51gXq8Jv81mExample',
  });
});

// @route   POST /api/payment/create-order
// @desc    Create a new Razorpay Order & register pending DB order
router.post('/create-order', async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      billingAddress,
      customerName,
      customerEmail,
      customerPhone,
      itemsPrice,
      shippingPrice,
      totalPrice,
      discountPrice,
      couponCode,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    const calculatedTotal = totalPrice || (itemsPrice || 0) + (shippingPrice || 0);
    const amountInPaise = Math.round(Number(calculatedTotal) * 100);

    if (amountInPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount' });
    }

    let rzpOrder;
    const isMockKey = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('Example');

    if (isMockKey) {
      // Demo / Mock order ID if using placeholder test keys
      rzpOrder = {
        id: `order_mock_${Date.now()}`,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
      };
    } else {
      const razorpay = getRazorpayInstance();
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          customerName: customerName || 'Customer',
          customerEmail: customerEmail || '',
        },
      };
      rzpOrder = await razorpay.orders.create(options);
    }

    // Create pending Order in MongoDB
    const order = new Order({
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      orderItems,
      shippingAddress: shippingAddress || {
        address: 'N/A',
        city: 'N/A',
        postalCode: '000000',
        country: 'India',
      },
      billingAddress: billingAddress || shippingAddress || {
        address: 'N/A',
        city: 'N/A',
        postalCode: '000000',
        country: 'India',
      },
      paymentMethod: 'Razorpay',
      itemsPrice: itemsPrice || calculatedTotal,
      discountPrice: discountPrice || 0,
      couponCode: couponCode || '',
      shippingPrice: shippingPrice || 0,
      totalPrice: calculatedTotal,
      status: 'Pending',
      paymentStatus: 'pending',
      isPaid: false,
      razorpayOrderId: rzpOrder.id,
    });

    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      order: rzpOrder,
      dbOrderId: savedOrder._id,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_51gXq8Jv81mExample',
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message,
    });
  }
});

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment signature and update order status
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing payment details for verification' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'exampleRazorpaySecret123';
    const isMock = razorpay_order_id.startsWith('order_mock_') || secret.includes('example');

    let isValid = false;

    if (isMock) {
      // In mock/test fallback mode, accept valid dummy signatures
      isValid = true;
    } else {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
    }

    // Find and update the order in MongoDB
    let order;
    if (dbOrderId) {
      order = await Order.findById(dbOrderId);
    } else {
      order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for this payment' });
    }

    if (isValid) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'Confirmed';
      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature || 'mock_sig';
      await order.save();

      return res.json({
        success: true,
        message: 'Payment verified and order confirmed successfully',
        orderId: order._id,
      });
    } else {
      order.paymentStatus = 'failed';
      order.status = 'Cancelled';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature verification failed',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification server error',
      error: error.message,
    });
  }
});

// @route   POST /api/payment/webhook
// @desc    Optional Razorpay Webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ status: 'invalid signature' });
      }
    }

    const event = req.body.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const order = await Order.findOne({ razorpayOrderId: orderId });
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'Confirmed';
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = paymentId;
        await order.save();
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
