const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { createShiprocketOrder } = require('../utils/shiprocketService');
const {
  sendOrderPlacedNotification,
  sendAdminOrderPlacedNotification,
  sendStockAlertNotification,
} = require('../utils/notificationService');

// Helper to escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Deduct inventory when order is paid
async function deductInventoryForOrder(orderItems) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return;
  for (const item of orderItems) {
    const qty = Math.max(1, Number(item.qty || item.quantity || 1));
    let product = null;

    if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
      product = await Product.findById(item.product);
    }
    if (!product && item.name) {
      product = await Product.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(item.name.trim())}$`, 'i') },
      });
    }
    if (!product && item.name) {
      const firstWord = item.name.trim().split(' ')[0];
      if (firstWord && firstWord.length >= 3) {
        product = await Product.findOne({
          name: { $regex: new RegExp(`^${escapeRegex(firstWord)}`, 'i') },
        });
      }
    }

    if (product) {
      const oldStock = Number(product.countInStock) || 0;
      const newStock = Math.max(0, oldStock - qty);
      product.countInStock = newStock;
      await product.save();
      console.log(`📉 [Inventory Deducted] "${product.name}" stock: ${oldStock} -> ${newStock} (-${qty})`);

      if (newStock <= 10) {
        sendStockAlertNotification({ product, newStock, oldStock }).catch(err => {
          console.error('Error sending stock alert notification:', err.message);
        });
      }
    }
  }
}

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
  const key = process.env.RAZORPAY_KEY_ID || 'rzp_test_51gXq8Jv81mExample';
  res.json({
    key,
    configured: Boolean(key && process.env.RAZORPAY_KEY_SECRET),
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

    console.log('\n==========================================');
    console.log('🛒 [POST /api/payment/create-order]');
    console.log(`   Customer: ${customerName} (${customerEmail})`);
    console.log(`   Total Price: ₹${totalPrice}`);
    console.log('==========================================\n');

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    let calculatedTotal = Number(totalPrice);
    if (!calculatedTotal || calculatedTotal <= 0) {
      const itemsSum = Number(itemsPrice) || orderItems.reduce((acc, item) => acc + (Number(item.price || 0) * Math.max(1, Number(item.qty || item.quantity || 1))), 0);
      calculatedTotal = itemsSum + Number(shippingPrice || 0) - Number(discountPrice || 0);
    }
    const amountInPaise = Math.round(Number(calculatedTotal) * 100);

    if (amountInPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount' });
    }

    let rzpOrder;
    const isMockKey = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('Example');

    if (isMockKey) {
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
        payment_capture: 1,
        notes: {
          customerName: customerName || 'Customer',
          customerEmail: customerEmail || '',
        },
      };
      rzpOrder = await razorpay.orders.create(options);
      console.log(`✅ Razorpay Order Created: ID="${rzpOrder.id}", Amount=${rzpOrder.amount} paise`);
    }

    // Consolidate duplicate products into single item entries with combined quantity
    const itemMap = new Map();
    (orderItems || []).forEach(item => {
      if (!item) return;
      const key = String(item.product || item.name || item.title || '').trim().toLowerCase();
      const qty = Math.max(1, Number(item.qty || item.quantity || 1));
      const price = Number(item.price || 0);
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.qty = (Number(existing.qty || 1)) + qty;
      } else {
        itemMap.set(key, {
          ...item,
          name: item.name || item.title || 'Fresh Product',
          qty: qty,
          price: price,
        });
      }
    });
    const sanitizedOrderItems = Array.from(itemMap.values());

    // Create pending Order in MongoDB
    const order = new Order({
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      orderItems: sanitizedOrderItems,
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
      paymentMethod: 'Razorpay (Online)',
      itemsPrice: itemsPrice || calculatedTotal,
      discountPrice: discountPrice || 0,
      couponCode: couponCode || '',
      shippingPrice: shippingPrice || 0,
      totalPrice: calculatedTotal,
      status: 'Pending',
      paymentStatus: 'pending',
      isPaid: false,
      razorpayOrderId: rzpOrder.id,
      inventoryDeducted: false,
    });

    const savedOrder = await order.save();
    console.log(`📦 MongoDB Pending Order Saved: ID="${savedOrder._id}", status="Pending", isPaid=false`);

    res.status(201).json({
      success: true,
      order: rzpOrder,
      dbOrderId: savedOrder._id,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_51gXq8Jv81mExample',
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Razorpay payment',
      error: error.message,
    });
  }
});

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment signature and update order status
router.post('/verify', async (req, res) => {
  try {
    let {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId,
    } = req.body;

    console.log('\n==========================================');
    console.log('💳 [POST /api/payment/verify] REQUEST RECEIVED:');
    console.log('   dbOrderId:          ', dbOrderId);
    console.log('   razorpay_order_id:  ', razorpay_order_id);
    console.log('   razorpay_payment_id:', razorpay_payment_id);
    console.log('   razorpay_signature: ', razorpay_signature ? `${razorpay_signature.slice(0, 15)}...` : 'MISSING');
    console.log('==========================================\n');

    if (!razorpay_order_id && !dbOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing order details for verification',
      });
    }

    // Find the pending order in MongoDB
    let order = null;
    if (dbOrderId && mongoose.Types.ObjectId.isValid(dbOrderId)) {
      order = await Order.findById(dbOrderId);
    }
    if (!order && razorpay_order_id) {
      order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    }

    if (!order) {
      console.error(`❌ MongoDB Order Not Found for dbOrderId="${dbOrderId}" / razorpayOrderId="${razorpay_order_id}"`);
      return res.status(404).json({ success: false, message: 'Order not found for payment verification' });
    }

    // If order is ALREADY paid & confirmed, return success immediately
    if (order.isPaid && order.status === 'Confirmed') {
      console.log(`✅ Order ${order._id} is already verified and marked as paid!`);
      return res.json({
        success: true,
        message: 'Order already verified and confirmed',
        orderId: order._id,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus
      });
    }

    const secret = (process.env.RAZORPAY_KEY_SECRET || 'vC56mYT2P6k3cw66tJMdS7pF').trim();
    const targetRzpOrderId = razorpay_order_id || order.razorpayOrderId;
    const isMock = Boolean(targetRzpOrderId && targetRzpOrderId.startsWith('order_mock_'));

    let isValid = false;

    if (isMock) {
      isValid = true;
    } else {
      // 1. Signature Check
      if (razorpay_signature && targetRzpOrderId && razorpay_payment_id) {
        const payload = `${targetRzpOrderId}|${razorpay_payment_id}`;
        const generatedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex');

        isValid = (generatedSignature === razorpay_signature.trim());
        console.log('🔑 Signature Verification Analysis:');
        console.log('   Payload:            ', payload);
        console.log('   Generated Signature:', generatedSignature);
        console.log('   Received Signature: ', razorpay_signature);
        console.log('   Result:             ', isValid ? '✅ MATCH / SIGNATURE VALID' : '❌ MISMATCH / SIGNATURE INVALID');
      }

      // 2. Failsafe: Direct API Verification with Razorpay API using payment_id
      if (!isValid && razorpay_payment_id) {
        try {
          const razorpay = getRazorpayInstance();
          const paymentEntity = await razorpay.payments.fetch(razorpay_payment_id);
          if (paymentEntity && (paymentEntity.status === 'captured' || paymentEntity.status === 'authorized')) {
            console.log(`✅ [Razorpay API Direct Verification] Payment ${razorpay_payment_id} status is "${paymentEntity.status}"! Verification PASSED.`);
            isValid = true;
          }
        } catch (apiErr) {
          console.warn('[Razorpay API Direct Verification Warning]:', apiErr.message);
        }
      }

      // 3. Failsafe: Query order payments from Razorpay API using targetRzpOrderId
      if (!isValid && targetRzpOrderId) {
        try {
          const razorpay = getRazorpayInstance();
          const paymentsList = await razorpay.orders.fetchPayments(targetRzpOrderId);
          if (paymentsList && Array.isArray(paymentsList.items) && paymentsList.items.length > 0) {
            const successfulPayment = paymentsList.items.find(p => p.status === 'captured' || p.status === 'authorized');
            if (successfulPayment) {
              console.log(`✅ [Razorpay Order Payments Fetch] Found captured payment ${successfulPayment.id}! Verification PASSED.`);
              isValid = true;
              if (!razorpay_payment_id) razorpay_payment_id = successfulPayment.id;
            }
          }
        } catch (ordErr) {
          console.warn('[Razorpay Order Payments Fetch Warning]:', ordErr.message);
        }
      }
    }

    if (isValid) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'Confirmed';
      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpay_payment_id || `pay_${Date.now()}`;
      order.razorpaySignature = razorpay_signature || 'verified_signature';
      order.transactionId = razorpay_payment_id || `pay_${Date.now()}`;

      if (!order.inventoryDeducted) {
        try {
          await deductInventoryForOrder(order.orderItems);
          order.inventoryDeducted = true;
        } catch (stockErr) {
          console.error('Error deducting inventory on Razorpay verification:', stockErr);
        }
      }

      const updatedOrder = await order.save();

      console.log(`✅ [ORDER UPDATED IN MONGODB & CONFIRMED]`);
      console.log(`   Order ID:       ${updatedOrder._id}`);
      console.log(`   status:         "${updatedOrder.status}"`);
      console.log(`   isPaid:         ${updatedOrder.isPaid}`);
      console.log(`   paymentStatus:  "${updatedOrder.paymentStatus}"`);
      console.log(`   paidAt:         ${updatedOrder.paidAt}`);

      sendOrderPlacedNotification({ order: updatedOrder }).catch(err => {
        console.error('Error dispatching customer payment invoice email:', err.message);
      });
      sendAdminOrderPlacedNotification({ order: updatedOrder }).catch(err => {
        console.error('Error dispatching admin order alert email:', err.message);
      });
      createShiprocketOrder(updatedOrder).catch(err => {
        console.warn('[Shiprocket] Auto push payment notice:', err.message);
      });

      return res.json({
        success: true,
        message: 'Payment verified and order confirmed successfully',
        orderId: updatedOrder._id,
        orderStatus: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();

      console.error(`❌ Payment verification failed for Order ID="${order._id}"`);

      return res.status(400).json({
        success: false,
        message: 'Payment signature could not be verified or payment was not completed.',
      });
    }
  } catch (error) {
    console.error('❌ Exception during payment verification:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification server error',
      error: error.message,
    });
  }
});

// @route   GET /api/payment/check-status/:dbOrderId
// @desc    Check status of order & sync with Razorpay if callback was interrupted or refreshed
router.get('/check-status/:dbOrderId', async (req, res) => {
  try {
    const { dbOrderId } = req.params;
    if (!dbOrderId || !mongoose.Types.ObjectId.isValid(dbOrderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(dbOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.isPaid) {
      return res.json({ success: true, isPaid: true, order });
    }

    if (order.razorpayOrderId && !order.razorpayOrderId.startsWith('order_mock_')) {
      try {
        const razorpay = getRazorpayInstance();
        const paymentsList = await razorpay.orders.fetchPayments(order.razorpayOrderId);
        if (paymentsList && Array.isArray(paymentsList.items) && paymentsList.items.length > 0) {
          const successfulPayment = paymentsList.items.find(p => p.status === 'captured' || p.status === 'authorized');
          if (successfulPayment) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.status = 'Confirmed';
            order.paymentStatus = 'paid';
            order.razorpayPaymentId = successfulPayment.id;
            order.transactionId = successfulPayment.id;

            if (!order.inventoryDeducted) {
              await deductInventoryForOrder(order.orderItems);
              order.inventoryDeducted = true;
            }

            const updatedOrder = await order.save();
            sendOrderPlacedNotification({ order: updatedOrder }).catch(e => {});
            sendAdminOrderPlacedNotification({ order: updatedOrder }).catch(e => {});
            createShiprocketOrder(updatedOrder).catch(e => {});

            return res.json({ success: true, isPaid: true, order: updatedOrder });
          }
        }
      } catch (rzpErr) {
        console.warn('Check status Razorpay fetch warning:', rzpErr.message);
      }
    }

    return res.json({ success: true, isPaid: false, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/payment/webhook
// @desc    Razorpay Webhook endpoint
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
        order.transactionId = paymentId;

        if (!order.inventoryDeducted) {
          try {
            await deductInventoryForOrder(order.orderItems);
            order.inventoryDeducted = true;
          } catch (stockErr) {
            console.error('Error deducting inventory on webhook:', stockErr);
          }
        }

        await order.save();
        console.log(`✅ [WEBHOOK] Order ${order._id} confirmed via Razorpay webhook.`);

        sendOrderPlacedNotification({ order }).catch(e => {});
        sendAdminOrderPlacedNotification({ order }).catch(e => {});
        createShiprocketOrder(order).catch(e => {});
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
