const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    default: 'Festive Offers Are Here!'
  },
  subtitle: {
    type: String,
    trim: true,
    default: 'Celebrate More. Save More. Shop Your Favorites.'
  },
  badgeText: {
    type: String,
    trim: true,
    default: 'Grand Festive Celebration'
  },
  discountText: {
    type: String,
    trim: true,
    default: 'UP TO 40% OFF'
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: 'FESTIVE40'
  },
  buttonText: {
    type: String,
    trim: true,
    default: 'SHOP NOW'
  },
  buttonLink: {
    type: String,
    trim: true,
    default: 'pages/collections.html?category=all'
  },
  image: {
    type: String,
    trim: true,
    default: 'assets/images/festive-hamper-banner.jpg'
  },
  bannerType: {
    type: String,
    enum: ['homepage_festive', 'homepage_hero', 'popup_modal'],
    default: 'homepage_festive'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  showPopupModal: {
    type: Boolean,
    default: true
  },
  deal1Title: {
    type: String,
    default: '20% OFF on Fresh Fruits'
  },
  deal1Sub: {
    type: String,
    default: 'Almonds, Cashews & Native Organic Fruits'
  },
  deal1Badge: {
    type: String,
    default: '20% OFF'
  },
  deal1Link: {
    type: String,
    default: 'pages/categories/dry-fruits-nuts.html'
  },
  deal1Image: {
    type: String,
    default: 'https://cdn.shopify.com/s/files/1/0858/0772/6869/collections/seeds_dry_fruits_nuts_webp_200x200_crop_center.jpg?v=1746963459'
  },
  deal2Title: {
    type: String,
    default: '30% OFF on Vegetables'
  },
  deal2Sub: {
    type: String,
    default: 'Farm Vegetables & Pure Cooking Essentials'
  },
  deal2Badge: {
    type: String,
    default: '30% OFF'
  },
  deal2Link: {
    type: String,
    default: 'pages/categories/cooking-essentials.html'
  },
  deal2Image: {
    type: String,
    default: 'https://cdn.shopify.com/s/files/1/0858/0772/6869/collections/groceries_200x200_crop_center.jpg?v=1746965740'
  },
  deal3Title: {
    type: String,
    default: '40% OFF on Combo Offers'
  },
  deal3Sub: {
    type: String,
    default: 'A2 Bilona Ghee + Wood-Pressed Oils Hamper'
  },
  deal3Badge: {
    type: String,
    default: '40% OFF'
  },
  deal3Link: {
    type: String,
    default: 'pages/collections.html?category=all'
  },
  deal3Image: {
    type: String,
    default: 'https://cdn.shopify.com/s/files/1/0858/0772/6869/collections/ghee_1_200x200_crop_center.jpg?v=1746964905'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
