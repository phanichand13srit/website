const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Collection = require('../models/Collection');

// ============================================================
// GET /api/analytics/summary
// Full financial & sales analytics from all MongoDB collections
// ============================================================
router.get('/summary', async (req, res) => {
  try {
    // ── 1. All orders ─────────────────────────────────────────
    const allOrders = await Order.find({}).sort({ createdAt: -1 });
    const activeOrders  = allOrders.filter(o => o.status !== 'Cancelled');
    const cancelledOrders = allOrders.filter(o => o.status === 'Cancelled');
    const deliveredOrders = allOrders.filter(o => o.status === 'Delivered');

    // Revenue (exclude cancelled)
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const totalDiscount = activeOrders.reduce((sum, o) => sum + Number(o.discountPrice || 0), 0);

    // Average Order Value
    const aov = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

    // Units sold
    let totalUnitsSold = 0;
    activeOrders.forEach(o => {
      if (Array.isArray(o.orderItems)) {
        o.orderItems.forEach(item => {
          totalUnitsSold += Number(item.qty || 1);
        });
      }
    });

    // Delivery rate
    const deliveryRate = allOrders.length > 0
      ? Math.round((deliveredOrders.length / allOrders.length) * 100)
      : 0;

    // ── 2. Order status counts ────────────────────────────────
    const statusCounts = {};
    allOrders.forEach(o => {
      const s = o.status || 'Placed';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // ── 3. Payment method breakdown ───────────────────────────
    const paymentCounts = {};
    allOrders.forEach(o => {
      const mode = (o.paymentMethod || 'Razorpay Secure').trim();
      paymentCounts[mode] = (paymentCounts[mode] || 0) + 1;
    });

    // ── 4. Revenue by date (for timeline chart) ────────────────
    const revenueByDate = {};
    allOrders.forEach(o => {
      const date = new Date(o.createdAt);
      const key  = date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!revenueByDate[key]) {
        revenueByDate[key] = { date: key, revenue: 0, orders: 0, cancelled: 0 };
      }
      if (o.status !== 'Cancelled') {
        revenueByDate[key].revenue += Number(o.totalPrice || 0);
      } else {
        revenueByDate[key].cancelled += 1;
      }
      revenueByDate[key].orders += 1;
    });

    const timeline = Object.values(revenueByDate).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    // ── 5. Revenue by category (via product lookup) ───────────
    const allProducts = await Product.find({});
    const productMap  = {};
    allProducts.forEach(p => {
      productMap[String(p._id)] = p;
      productMap[p.name]        = p; // name fallback
    });

    const categoryRevenueMap = {};
    const productSalesMap    = {}; // { productName: { units, revenue, product } }

    activeOrders.forEach(o => {
      if (!Array.isArray(o.orderItems)) return;
      o.orderItems.forEach(item => {
        const qty   = Number(item.qty || 1);
        const price = Number(item.price || 0);
        const lineTotal = qty * price;

        // Resolve category
        let category = 'Uncategorized';
        const prod = (item.product && productMap[String(item.product)])
          || productMap[item.name];
        if (prod && prod.category) {
          category = prod.category;
        }

        // Category revenue
        categoryRevenueMap[category] = (categoryRevenueMap[category] || 0) + lineTotal;

        // Product revenue leaderboard
        const productName = item.name || (prod ? prod.name : 'Unknown');
        if (!productSalesMap[productName]) {
          productSalesMap[productName] = {
            name:     productName,
            category: prod ? (prod.category || 'General') : 'General',
            units:    0,
            revenue:  0,
            image:    prod ? (prod.image || (prod.images && prod.images[0] && prod.images[0].url) || '') : (item.image || ''),
            stock:    prod ? Number(prod.countInStock || 0) : 0,
            price:    prod ? Number(prod.price || 0) : price,
          };
        }
        productSalesMap[productName].units   += qty;
        productSalesMap[productName].revenue += lineTotal;
      });
    });

    const categoryRevenue = Object.entries(categoryRevenueMap)
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue);

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ── 6. Products summary ───────────────────────────────────
    let inventoryValue = 0;
    let outOfStock     = 0;
    let lowStock       = 0;

    allProducts.forEach(p => {
      const stock = Number(p.countInStock || 0);
      const price = Number(p.price || 0);
      inventoryValue += stock * price;
      if (stock === 0) outOfStock++;
      else if (stock < 10) lowStock++;
    });

    // ── 7. Users / Customers ──────────────────────────────────
    const allUsers      = await User.find({}).select('-password');
    const customers     = allUsers.filter(u => u.role !== 'admin');
    const admins        = allUsers.filter(u => u.role === 'admin');

    // Customers who ordered
    const customerOrderMap = {};
    allOrders.forEach(o => {
      const key = o.customerEmail || o.customerName || String(o._id);
      if (!customerOrderMap[key]) {
        customerOrderMap[key] = { name: o.customerName, email: o.customerEmail, orders: 0, spent: 0 };
      }
      customerOrderMap[key].orders += 1;
      if (o.status !== 'Cancelled') {
        customerOrderMap[key].spent += Number(o.totalPrice || 0);
      }
    });

    const topCustomers = Object.values(customerOrderMap)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    // ── 8. Coupons ────────────────────────────────────────────
    const allCoupons      = await Coupon.find({});
    const activeCoupons   = allCoupons.filter(c => c.isActive);
    const couponUsageMap  = {};
    allOrders.forEach(o => {
      if (o.couponCode) {
        couponUsageMap[o.couponCode] = (couponUsageMap[o.couponCode] || 0) + 1;
      }
    });
    const topCoupons = Object.entries(couponUsageMap)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── 9. Collections ────────────────────────────────────────
    const allCollections = await Collection.find({});

    // ── 10. Recent orders for the ledger table ────────────────
    const recentOrders = allOrders.slice(0, 20).map(o => ({
      _id:           String(o._id),
      customerName:  o.customerName || 'Customer',
      customerEmail: o.customerEmail || '',
      customerPhone: o.customerPhone || '',
      status:        o.status || 'Placed',
      paymentMethod: o.paymentMethod || 'Razorpay Secure',
      totalPrice:    Number(o.totalPrice || 0),
      itemsPrice:    Number(o.itemsPrice || 0),
      shippingPrice: Number(o.shippingPrice || 0),
      discountPrice: Number(o.discountPrice || 0),
      couponCode:    o.couponCode || '',
      isPaid:        o.isPaid || false,
      orderItems:    o.orderItems || [],
      createdAt:     o.createdAt,
    }));

    // ── Final combined response ───────────────────────────────
    res.json({
      // Overview KPIs
      kpis: {
        totalRevenue:    Math.round(totalRevenue * 100) / 100,
        totalOrders:     allOrders.length,
        activeOrders:    activeOrders.length,
        cancelledOrders: cancelledOrders.length,
        deliveredOrders: deliveredOrders.length,
        deliveryRate,
        aov:             Math.round(aov * 100) / 100,
        totalUnitsSold,
        totalDiscount:   Math.round(totalDiscount * 100) / 100,
      },

      // Products
      products: {
        total:          allProducts.length,
        inventoryValue: Math.round(inventoryValue),
        outOfStock,
        lowStock,
      },

      // Customers
      customers: {
        total:     allUsers.length,
        customers: customers.length,
        admins:    admins.length,
        topCustomers,
      },

      // Coupons
      coupons: {
        total:       allCoupons.length,
        active:      activeCoupons.length,
        inactive:    allCoupons.length - activeCoupons.length,
        topCoupons,
      },

      // Collections
      collections: {
        total: allCollections.length,
        names: allCollections.map(c => c.title || c.name),
      },

      // Chart Data
      charts: {
        // Orders & Revenue over time
        timeline,

        // Revenue split by product category
        categoryRevenue,

        // Order status distribution
        statusCounts,

        // Payment method distribution
        paymentCounts,
      },

      // Top performing products
      topProducts,

      // Recent orders ledger
      recentOrders,

      // Generated at
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[Analytics API Error]', err);
    res.status(500).json({ message: 'Failed to compute analytics', error: err.message });
  }
});

module.exports = router;
