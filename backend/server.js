const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// Route Imports
const productRoutes    = require('./routes/productRoutes');
const orderRoutes      = require('./routes/orderRoutes');
const userRoutes       = require('./routes/userRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const couponRoutes     = require('./routes/couponRoutes');
const reviewRoutes     = require('./routes/reviewRoutes');
const analyticsRoutes  = require('./routes/analyticsRoutes');
const paymentRoutes    = require('./routes/paymentRoutes');
const shiprocketRoutes = require('./routes/shiprocketRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend HTML pages to call the API
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-dev']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/products',    productRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/coupons',     couponRoutes);
app.use('/api/reviews',     reviewRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/payment',     paymentRoutes);
app.use('/api/shiprocket',  shiprocketRoutes);


const path = require('path');

// Root Healthcheck
app.get('/api', (req, res) => {
  res.json({ status: 'healthy', database: 'MongoDB Connected', time: new Date() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: 'MongoDB Connected', time: new Date() });
});

// Serve Frontend Static HTML, CSS, JS & Images
app.use(express.static(path.join(__dirname, '../')));

// Fallback to index.html for root navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Explicit search route redirect to support legacy /search URLs
app.get('/search', (req, res) => {
  const query = req.query.q || req.query.search || '';
  res.redirect(`/pages/collections.html?search=${encodeURIComponent(query)}`);
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🎉 ARSHITH FRESH IS LIVE! Click the links below:`);
  console.log(`======================================================`);
  console.log(`🌐 Storefront Website : http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard    : http://localhost:${PORT}/admin/dashboard.html`);
  console.log(`📡 Backend REST API   : http://localhost:${PORT}/api/products`);
  console.log(`======================================================\n`);
});
