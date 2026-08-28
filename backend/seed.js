const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const Collection = require('./models/Collection');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arshith_fresh';

const sampleProducts = [
  {
    name: 'Groundnut Oil (Premium Quality)',
    category: 'Oils',
    price: 349,
    originalPrice: 471,
    unit: '1 Litre',
    countInStock: 25,
    brand: 'Arshith Fresh',
    image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_1.jpg?v=1757334051&width=533',
    hoverImage: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-06-30_at_7.28.42_PM_1_3752719d-4e83-4d00-a8be-0c4d13076c23.jpg?v=1757334051&width=533',
    description: '100% pure cold-pressed groundnut oil, ideal for healthy everyday cooking.',
    rating: 4.9,
    numReviews: 67,
    isFeatured: true,
  },
  {
    name: 'Coconut Oil (Premium Quality)',
    category: 'Oils',
    price: 165,
    originalPrice: 214,
    unit: '500 ml',
    countInStock: 30,
    brand: 'Arshith Fresh',
    image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_2.jpg?v=1757334050&width=533',
    hoverImage: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-06-30_at_7.28.41_PM_887d3105-a7d1-45a3-b1b0-e0054291d902.jpg?v=1757334050&width=533',
    description: 'Unrefined, fragrant cold-pressed coconut oil from sun-dried copra.',
    rating: 4.83,
    numReviews: 54,
    isFeatured: true,
  },
  {
    name: 'Pure Buffalo Ghee (Premium Quality)',
    category: 'Ghee & Honey',
    price: 222,
    originalPrice: 288,
    unit: '250 ml',
    countInStock: 20,
    brand: 'Arshith Fresh',
    image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-09-15_at_4.34.52_PM.jpg?v=1757934372&width=533',
    hoverImage: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-06-30_at_7.32.29_PM_2_eb23ab0e-a49c-457d-9dad-00ce2758289c.jpg?v=1757934372&width=533',
    description: 'Traditional granular bilona buffalo ghee with rich aroma and taste.',
    rating: 4.91,
    numReviews: 32,
    isFeatured: true,
  },
  {
    name: 'Sunflower Oil (Premium Quality)',
    category: 'Oils',
    price: 499,
    originalPrice: 608,
    unit: '1 Litre',
    countInStock: 18,
    brand: 'Arshith Fresh',
    image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM.jpg?v=1757334052&width=533',
    description: 'Light, nutrient-dense cold-pressed sunflower oil for light frying and baking.',
    rating: 4.91,
    numReviews: 54,
    isFeatured: true,
  },
  {
    name: 'Flax Seeds (Premium Quality)',
    category: 'Seeds',
    price: 29,
    originalPrice: 36,
    unit: '100 g',
    countInStock: 50,
    brand: 'Arshith Fresh',
    image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-07-08_at_4.04.02_PM_2_ce2dcb8e-81dc-46c5-b343-1a14dff25208.jpg?v=1757334052&width=533',
    description: 'Omega-3 rich golden brown flax seeds for everyday smoothies and bowls.',
    rating: 4.9,
    numReviews: 31,
    isFeatured: false,
  },
  {
    name: 'Chia Seeds (Premium Quality)',
    category: 'Seeds',
    price: 49,
    originalPrice: 53,
    unit: '100 g',
    countInStock: 45,
    brand: 'Arshith Fresh',
    image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-07-08_at_4.04.01_PM_6b2e5750-03f7-4a0a-b4e3-9ef639891875.jpg?v=1757333987&width=533',
    description: 'High-fiber superfood chia seeds, 100% natural and clean.',
    rating: 4.91,
    numReviews: 35,
    isFeatured: false,
  },
  {
    name: 'Chana Dal Spice Powder (Pappula Podi)',
    category: 'Spice Powders',
    price: 59,
    originalPrice: 80,
    unit: '100 g',
    countInStock: 40,
    brand: 'Arshith Fresh',
    image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-07-08_at_4.19.01_PM_2_717030b8-c8a8-40a4-bdf0-7e516dec3029.jpg?v=1757334045&width=533',
    description: 'Authentic Andhra style homemade roasted chana dal podi with ghee flavor.',
    rating: 5.0,
    numReviews: 31,
    isFeatured: true,
  },
  {
    name: 'Garlic Powder (Velluli Karam)',
    category: 'Spice Powders',
    price: 59,
    originalPrice: 80,
    unit: '100 g',
    countInStock: 35,
    brand: 'Arshith Fresh',
    image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-07-08_at_4.19.01_PM_3_6262e177-7c59-4137-afc4-5d486daa9175.jpg?v=1757334046&width=533',
    description: 'Spicy, pungent country garlic podi blended with red chillies and cumin.',
    rating: 4.97,
    numReviews: 38,
    isFeatured: true,
  },
  {
    name: 'Fresh Malai Paneer (Pure & Soft)',
    category: 'Dairy',
    subcategory: 'Fresh Paneer',
    price: 95,
    originalPrice: 120,
    unit: '200 g',
    countInStock: 25,
    brand: 'Arshith Fresh',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
    description: '100% natural, soft, rich cottage cheese made from fresh cow milk.',
    rating: 4.95,
    numReviews: 42,
    isFeatured: true,
  },
  {
    name: 'Pure Organic Cow Milk (Pasteurized)',
    category: 'Dairy',
    subcategory: 'Pure Cow Milk',
    price: 42,
    originalPrice: 50,
    unit: '500 ml',
    countInStock: 40,
    brand: 'Arshith Fresh',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
    description: 'Farm fresh, unadulterated pure cow milk delivered daily.',
    rating: 4.88,
    numReviews: 58,
    isFeatured: true,
  }
];

const sampleCollections = [
  { 
    title: 'Oils', 
    description: 'Wood Pressed & Cold Pressed Oils', 
    image: '../assets/images/banners/oils_banner_hero_golden.png',
    conditionsSummary: 'Tag includes Oils',
    subcategories: ['Cold-Pressed Groundnut Oil', 'Wood-Pressed Sesame Oil', 'Coconut Oil', 'Sunflower Oil', 'Mustard Oil', 'Castor Oil']
  },
  { 
    title: 'Dry Fruits', 
    description: 'Almonds, Cashews, Walnuts & Raisins', 
    image: 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=500&auto=format&fit=crop&q=80',
    conditionsSummary: 'Tag includes Dry Fruits',
    subcategories: ['Almonds (Badam)', 'Cashews (Kaju)', 'Dates (Khajoor)', 'Walnuts (Akhrot)', 'Pistachios (Pista)', 'Raisins (Kismis)', 'Dry Figs (Anjeer)']
  },
  { 
    title: 'Seeds', 
    description: 'Chia, Flax, Pumpkin & Sunflower Seeds', 
    image: '../assets/images/banners/seeds_banner_blue_bowls.png',
    conditionsSummary: 'Tag includes Seeds',
    subcategories: ['Chia Seeds', 'Flax Seeds', 'Pumpkin Seeds', 'Sunflower Seeds', 'Watermelon Seeds', 'Sesame Seeds (Til)']
  },
  { 
    title: 'Ghee & Honey', 
    description: 'Pure Buffalo Ghee & Wild Forest Honey', 
    image: '../assets/images/banners/ghee_honey_banner_jars.png',
    conditionsSummary: 'Tag includes Ghee',
    subcategories: ['Pure Desi Cow Ghee', 'Pure Buffalo Ghee', 'Raw Wild Forest Honey', 'Organic Honeycomb']
  },
  { 
    title: 'Cooking Essentials', 
    description: 'Daily Kitchen Essentials', 
    image: '../assets/images/banners/cooking_essentials_banner_pouches.png',
    conditionsSummary: 'Tag includes Essentials',
    subcategories: ['Cold-Pressed Cooking Oils', 'Rock Salt / Himalayan Pink Salt', 'Natural Organic Jaggery / Bellam', 'Country Tamarind / Chintapandu']
  },
  { 
    title: 'Spices', 
    description: 'Whole authentic spices', 
    image: '../assets/images/banners/spices_banner_pouches.png',
    conditionsSummary: 'Tag includes Spices',
    subcategories: ['Whole Spices', 'Black Pepper', 'Green Cardamom (Elaichi)', 'Cloves (Lavangam)', 'Cinnamon (Dalchina Chekka)', 'Cumin Seeds (Jeera)', 'Mustard Seeds (Avalu)']
  },
  { 
    title: 'Spice Powders', 
    description: 'Traditional homemade Andhra podulu', 
    image: '../assets/images/banners/spice_powders_banner_pouches.png',
    conditionsSummary: 'Tag includes Powders',
    subcategories: ['Chana Dal Podi (Pappula Podi)', 'Garlic Podi (Vellulli Karam)', 'Kandi Podi', 'Karivepaku Podi (Curry Leaf)', 'Flax Seed Podi', 'Sambar & Rasam Powder']
  },
  { 
    title: 'Fresh Vegetables', 
    description: 'Farm-fresh organic vegetables & greens', 
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
    conditionsSummary: 'Tag includes Vegetables',
    subcategories: ['Tomatoes', 'Onions', 'Potatoes', 'Green Leafy Vegetables', 'Carrots & Beetroots', 'Organic Chillies']
  },
  { 
    title: 'Dairy', 
    description: 'Farm-fresh milk, paneer, curd, butter & cheese', 
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
    conditionsSummary: 'Tag includes Dairy',
    subcategories: ['Pure Cow Milk', 'Buffalo Milk', 'Fresh Paneer', 'Thick Curd / Yogurt', 'Desi Butter (White Butter)', 'Buttermilk (Majjiga)', 'Cheese']
  }
];

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected! Resetting collections...');

    // Clear old data
    await Product.deleteMany({});
    await Collection.deleteMany({});
    await User.deleteMany({});

    // Insert Products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${insertedProducts.length} starter products.`);

    // Insert Collections
    const insertedCollections = await Collection.insertMany(sampleCollections);
    console.log(`✅ Inserted ${insertedCollections.length} starter collections.`);

    // Insert Admin User
    const adminUser = await User.create({
      name: 'Admin Arshith',
      email: 'admin@arshithfresh.com',
      password: 'adminpassword123',
      role: 'admin',
      phone: '9876543210',
    });
    console.log(`✅ Created default Admin account: ${adminUser.email}`);

    console.log('\n🎉 MongoDB database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
