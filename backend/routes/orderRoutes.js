const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Helper to escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Deduct inventory when order is placed or un-cancelled
async function deductInventoryForOrder(orderItems) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return;
  for (const item of orderItems) {
    const qty = Math.max(1, Number(item.qty || item.quantity || 1));
    let product = null;

    // 1. Match by ObjectId
    if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
      product = await Product.findById(item.product);
    }

    // 2. Match by exact product name
    if (!product && item.name) {
      product = await Product.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(item.name.trim())}$`, 'i') }
      });
    }

    // 3. Fallback: match by starting title words
    if (!product && item.name) {
      const firstWord = item.name.trim().split(' ')[0];
      if (firstWord && firstWord.length >= 3) {
        product = await Product.findOne({
          name: { $regex: new RegExp(`^${escapeRegex(firstWord)}`, 'i') }
        });
      }
    }

    if (product) {
      const oldStock = Number(product.countInStock) || 0;
      const newStock = Math.max(0, oldStock - qty);
      product.countInStock = newStock;
      await product.save();
      console.log(`📉 [Inventory Deducted] "${product.name}" stock: ${oldStock} -> ${newStock} (-${qty})`);
    } else {
      console.warn(`⚠️ [Inventory Warning] Could not find product to deduct stock: ${item.name || item.product}`);
    }
  }
}

// Restore inventory when order is cancelled
async function restoreInventoryForOrder(orderItems) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return;
  for (const item of orderItems) {
    const qty = Math.max(1, Number(item.qty || item.quantity || 1));
    let product = null;

    // 1. Match by ObjectId
    if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
      product = await Product.findById(item.product);
    }

    // 2. Match by exact product name
    if (!product && item.name) {
      product = await Product.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(item.name.trim())}$`, 'i') }
      });
    }

    // 3. Fallback: match by starting title words
    if (!product && item.name) {
      const firstWord = item.name.trim().split(' ')[0];
      if (firstWord && firstWord.length >= 3) {
        product = await Product.findOne({
          name: { $regex: new RegExp(`^${escapeRegex(firstWord)}`, 'i') }
        });
      }
    }

    if (product) {
      const oldStock = Number(product.countInStock) || 0;
      const newStock = oldStock + qty;
      product.countInStock = newStock;
      await product.save();
      console.log(`📈 [Inventory Restored] "${product.name}" stock: ${oldStock} -> ${newStock} (+${qty})`);
    } else {
      console.warn(`⚠️ [Inventory Warning] Could not find product to restore stock: ${item.name || item.product}`);
    }
  }
}

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

// @route   POST /api/orders
// @desc    Create a new order (Checkout) & automatically decrement inventory
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
      discountPrice,
      discountAmount,
      couponCode,
      isPaid,
      status
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

    const orderStatus = status || 'Placed';

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
      discountPrice: discountPrice || discountAmount || 0,
      couponCode: couponCode || '',
      shippingPrice: shippingPrice || 0,
      totalPrice,
      isPaid: isPaid || false,
      status: orderStatus,
      inventoryDeducted: orderStatus !== 'Cancelled'
    });

    const createdOrder = await order.save();

    // Deduct stock for the ordered products if order is active (not cancelled)
    if (orderStatus !== 'Cancelled') {
      try {
        await deductInventoryForOrder(sanitizedItems);
      } catch (stockErr) {
        console.error('Error auto-deducting inventory on order creation:', stockErr);
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error placing order', error: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Confirmed, Dispatched, Delivered, Cancelled) & auto adjust stock
router.put('/:id/status', async (req, res) => {
  try {
    const { status, isPaid, isDelivered } = req.body;
    const id = req.params.id;

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ transactionId: id });
    }
    if (!order) {
      const allDBOrders = await Order.find({});
      order = allDBOrders.find(o => String(o._id).includes(id) || String(o.transactionId || '').includes(id));
    }
    if (!order) {
      order = await Order.findOne().sort({ createdAt: -1 });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    const newStatus = status || oldStatus;

    // 1. Transitioning to Cancelled -> Restore inventory
    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled' && order.inventoryDeducted !== false) {
      try {
        await restoreInventoryForOrder(order.orderItems);
        order.inventoryDeducted = false;
      } catch (restockErr) {
        console.error('Error restoring inventory on order cancellation:', restockErr);
      }
    }

    // 2. Transitioning from Cancelled back to Active status -> Re-deduct inventory
    if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled' && order.inventoryDeducted === false) {
      try {
        await deductInventoryForOrder(order.orderItems);
        order.inventoryDeducted = true;
      } catch (deductErr) {
        console.error('Error re-deducting inventory on order status reactivation:', deductErr);
      }
    }

    if (status) order.status = status;
    if (typeof isPaid === 'boolean') order.isPaid = isPaid;
    if (typeof isDelivered === 'boolean') order.isDelivered = isDelivered;
    if (status === 'Delivered') order.isDelivered = true;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});


// @route   PUT /api/orders/:id/cancel or POST /api/orders/:id/cancel
// @desc    Cancel an order and return all items back into inventory
const cancelOrderHandler = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.json({ message: 'Order is already cancelled', order });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ message: 'Delivered orders cannot be cancelled.' });
    }

    // Restore stock
    if (order.inventoryDeducted !== false) {
      try {
        await restoreInventoryForOrder(order.orderItems);
        order.inventoryDeducted = false;
      } catch (restockErr) {
        console.error('Error restoring inventory during order cancellation:', restockErr);
      }
    }

    order.status = 'Cancelled';
    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully and inventory was restored.',
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

router.put('/:id/cancel', cancelOrderHandler);
router.post('/:id/cancel', cancelOrderHandler);

module.exports = router;
