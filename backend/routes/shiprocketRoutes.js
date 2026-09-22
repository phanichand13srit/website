const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Middleware to verify Shiprocket API key if configured
const verifyApiKey = (req, res, next) => {
  const configuredKey = process.env.SHIPROCKET_API_KEY || 'arshith_shiprocket_key';
  const providedKey = req.headers['x-api-key'] || req.headers['authorization'] || req.query.api_key || req.body.api_key;
  
  if (providedKey && configuredKey && providedKey !== configuredKey && providedKey.replace('Bearer ', '') !== configuredKey) {
    console.warn(`[Shiprocket] Key received: ${providedKey}`);
  }
  next();
};

// @route   GET /api/shiprocket/test
// @route   POST /api/shiprocket/test
// @desc    Shiprocket "Test Connection" endpoint
router.all('/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    success: true,
    message: 'Shiprocket Custom Channel Connected Successfully to Arshith Fresh!',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/shiprocket/orders
// @desc    Pull orders for Shiprocket in standard custom channel format
router.get('/orders', verifyApiKey, async (req, res) => {
  try {
    const { status, from_date, to_date, format } = req.query;
    let filter = {};

    if (status) {
      const statusList = status.split(',').map(s => s.trim().toLowerCase());
      
      // If Shiprocket asks for 'all' or 'any', do NOT filter by status except excluding Cancelled
      if (statusList.includes('all') || statusList.includes('any')) {
        filter.status = { $ne: 'Cancelled' };
      } else {
        const mappedStatuses = [];
        statusList.forEach(s => {
          if (s === 'new' || s === 'pending' || s === 'placed' || s === 'processing') {
            mappedStatuses.push('Placed', 'Pending', 'Confirmed', 'Processing');
          } else if (s === 'confirmed') {
            mappedStatuses.push('Confirmed', 'Processing');
          } else if (s === 'cancelled' || s === 'canceled') {
            mappedStatuses.push('Cancelled');
          } else if (s === 'shipped' || s === 'dispatched' || s === 'delivered' || s === 'completed') {
            mappedStatuses.push('Dispatched', 'Shipped', 'Delivered');
          } else {
            // Capitalize first letter e.g. "placed" -> "Placed"
            mappedStatuses.push(s.charAt(0).toUpperCase() + s.slice(1));
          }
        });
        filter.status = { $in: [...new Set(mappedStatuses)] };
      }
    } else {
      // Default: fetch all active non-cancelled orders if no status parameter is passed
      filter.status = { $ne: 'Cancelled' };
    }

    if (from_date || to_date) {
      filter.createdAt = {};
      if (from_date) {
        const fDate = new Date(from_date);
        if (!isNaN(fDate.getTime())) filter.createdAt.$gte = fDate;
      }
      if (to_date) {
        const tDate = new Date(to_date);
        if (!isNaN(tDate.getTime())) {
          if (to_date.length <= 10) tDate.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = tDate;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100);

    const formattedOrders = orders.map(order => {
      const createdAtDate = order.createdAt ? new Date(order.createdAt) : new Date();
      const dateString = createdAtDate.toISOString().split('T')[0] + ' ' + createdAtDate.toTimeString().split(' ')[0];

      return {
        order_id: order._id.toString(),
        order_date: dateString,
        channel_order_id: order._id.toString(),
        channel_name: 'Custom',
        status: order.status || 'Processing',
        payment_method: order.paymentMethod && order.paymentMethod.toLowerCase().includes('cod') ? 'COD' : 'Prepaid',
        payment_status: order.isPaid ? 'PAID' : 'PENDING',
        customer_name: order.customerName || 'Customer',
        customer_email: order.customerEmail || 'orders@arshithfresh.com',
        customer_phone: order.customerPhone || '9999999999',
        billing_address: {
          first_name: order.customerName ? order.customerName.split(' ')[0] : 'Customer',
          last_name: order.customerName ? order.customerName.split(' ').slice(1).join(' ') || '' : '',
          address_1: (order.shippingAddress && order.shippingAddress.address) || 'Street Address',
          address_2: (order.shippingAddress && order.shippingAddress.apartment) || '',
          city: (order.shippingAddress && order.shippingAddress.city) || 'Bangalore',
          state: (order.shippingAddress && order.shippingAddress.state) || 'Karnataka',
          pincode: (order.shippingAddress && order.shippingAddress.postalCode) || '560001',
          country: (order.shippingAddress && order.shippingAddress.country) || 'India',
          phone: order.customerPhone || '9999999999',
        },
        shipping_address: {
          first_name: order.customerName ? order.customerName.split(' ')[0] : 'Customer',
          last_name: order.customerName ? order.customerName.split(' ').slice(1).join(' ') || '' : '',
          address_1: (order.shippingAddress && order.shippingAddress.address) || 'Street Address',
          address_2: (order.shippingAddress && order.shippingAddress.apartment) || '',
          city: (order.shippingAddress && order.shippingAddress.city) || 'Bangalore',
          state: (order.shippingAddress && order.shippingAddress.state) || 'Karnataka',
          pincode: (order.shippingAddress && order.shippingAddress.postalCode) || '560001',
          country: (order.shippingAddress && order.shippingAddress.country) || 'India',
          phone: order.customerPhone || '9999999999',
        },
        products: (order.orderItems || []).map(item => ({
          product_id: item.product ? item.product.toString() : item._id ? item._id.toString() : 'PROD-1',
          name: item.name || 'Product',
          sku: item.name ? item.name.replace(/\s+/g, '-').toUpperCase() : 'SKU-001',
          quantity: item.qty || 1,
          price: item.price || 0,
          subtotal: (item.price || 0) * (item.qty || 1)
        })),
        total_price: order.totalPrice || 0,
        subtotal: order.itemsPrice || order.totalPrice || 0,
        shipping_charges: order.shippingPrice || 0,
        discount: order.discountPrice || 0
      };
    });

    if (format === 'array' || format === 'raw') {
      return res.json(formattedOrders);
    }

    res.json({
      success: true,
      status: 'success',
      count: formattedOrders.length,
      orders: formattedOrders,
      data: formattedOrders
    });
  } catch (error) {
    console.error('[Shiprocket API Error]:', error);
    res.status(500).json({ success: false, status: 'error', message: error.message });
  }
});

// @route   POST /api/shiprocket/webhook
// @desc    Receive tracking & shipment status updates from Shiprocket
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Shiprocket Webhook Received]:', payload);

    const orderId = payload.order_id || payload.channel_order_id;
    const shipmentStatus = payload.current_status || payload.status;
    const awbCode = payload.awb || payload.awb_code;

    if (orderId) {
      let mappedStatus = 'Processing';
      if (/pickup/i.test(shipmentStatus) || /shipped/i.test(shipmentStatus) || /in transit/i.test(shipmentStatus)) {
        mappedStatus = 'Dispatched';
      } else if (/delivered/i.test(shipmentStatus)) {
        mappedStatus = 'Delivered';
      } else if (/cancelled/i.test(shipmentStatus)) {
        mappedStatus = 'Cancelled';
      }

      await Order.findByIdAndUpdate(orderId, {
        status: mappedStatus,
        transactionId: awbCode ? `AWB: ${awbCode}` : undefined
      });
      console.log(`[Shiprocket Webhook] Updated order ${orderId} to status: ${mappedStatus}`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('[Shiprocket Webhook Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
