const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Banner = require('../models/Banner');

// Default initial banner data
const defaultBannerData = {
  title: 'Festive Offers Are Here!',
  subtitle: 'Celebrate More. Save More. Shop Your Favorites.',
  badgeText: 'Grand Festive Celebration',
  discountText: 'UP TO 40% OFF',
  couponCode: 'FESTIVE40',
  buttonText: 'SHOP NOW',
  buttonLink: 'pages/collections.html?category=all',
  image: 'assets/images/festive-hamper-banner.jpg',
  bannerType: 'homepage_festive',
  isActive: true,
  showPopupModal: true,
  deal1Title: '20% OFF on Fresh Fruits',
  deal1Sub: 'Almonds, Cashews & Native Organic Fruits',
  deal1Badge: '20% OFF',
  deal1Link: 'pages/categories/dry-fruits-nuts.html',
  deal1Image: 'https://cdn.shopify.com/s/files/1/0858/0772/6869/collections/seeds_dry_fruits_nuts_webp_200x200_crop_center.jpg?v=1746963459',
  deal2Title: '30% OFF on Vegetables',
  deal2Sub: 'Farm Vegetables & Pure Cooking Essentials',
  deal2Badge: '30% OFF',
  deal2Link: 'pages/categories/cooking-essentials.html',
  deal2Image: 'https://cdn.shopify.com/s/files/1/0858/0772/6869/collections/groceries_200x200_crop_center.jpg?v=1746965740',
  deal3Title: '40% OFF on Combo Offers',
  deal3Sub: 'A2 Bilona Ghee + Wood-Pressed Oils Hamper',
  deal3Badge: '40% OFF',
  deal3Link: 'pages/collections.html?category=all',
  deal3Image: 'https://cdn.shopify.com/s/files/1/0858/0772/6869/collections/ghee_1_200x200_crop_center.jpg?v=1746964905'
};

// @route   GET /api/banners
// @desc    Get all banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ updatedAt: -1, createdAt: -1 });
    // If no banner exists, seed the default banner
    if (banners.length === 0) {
      const seeded = await Banner.create(defaultBannerData);
      return res.json([seeded]);
    }
    res.json(banners);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving banners', error: error.message });
  }
});

// @route   GET /api/banners/active
// @desc    Get the current active banner for Homepage & Festive Popup
router.get('/active', async (req, res) => {
  try {
    let activeBanner = await Banner.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!activeBanner) {
      // Check if any banner exists at all
      activeBanner = await Banner.findOne({}).sort({ updatedAt: -1 });
      if (!activeBanner) {
        activeBanner = await Banner.create(defaultBannerData);
      }
    }
    res.json({ success: true, banner: activeBanner });
  } catch (error) {
    console.error('Error fetching active banner:', error);
    res.json({ success: true, banner: defaultBannerData });
  }
});

// @route   POST /api/banners
// @desc    Create a new banner (Admin)
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.title || !data.title.trim()) {
      return res.status(400).json({ success: false, message: 'Banner title is required' });
    }

    // If set to active, deactivate others of same bannerType
    if (data.isActive) {
      await Banner.updateMany({ bannerType: data.bannerType || 'homepage_festive' }, { isActive: false });
    }

    const banner = new Banner(data);
    const saved = await banner.save();
    console.log(`✅ Saved new banner to MongoDB: "${saved.title}" (ID: ${saved._id})`);
    res.status(201).json({ success: true, banner: saved });
  } catch (error) {
    console.error('❌ Error creating banner:', error.message);
    res.status(400).json({ success: false, message: 'Error creating banner', error: error.message });
  }
});

// @route   PUT /api/banners/:id
// @desc    Update an existing banner (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.isActive) {
      await Banner.updateMany({ _id: { $ne: id }, bannerType: data.bannerType || 'homepage_festive' }, { isActive: false });
    }

    const updated = await Banner.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    console.log(`✅ Updated banner in MongoDB: "${updated.title}" (ID: ${updated._id})`);
    res.json({ success: true, banner: updated });
  } catch (error) {
    console.error('❌ Error updating banner:', error.message);
    res.status(400).json({ success: false, message: 'Error updating banner', error: error.message });
  }
});

// @route   PATCH /api/banners/:id/toggle
// @desc    Toggle banner active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const newStatus = !banner.isActive;
    if (newStatus) {
      await Banner.updateMany({ _id: { $ne: id }, bannerType: banner.bannerType }, { isActive: false });
    }
    banner.isActive = newStatus;
    await banner.save();

    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling banner status', error: error.message });
  }
});

// @route   DELETE /api/banners/:id
// @desc    Delete a banner (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Banner.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    console.log(`🗑️ Deleted banner: "${deleted.title}" (ID: ${deleted._id})`);
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting banner', error: error.message });
  }
});

// @route   POST /api/banners/upload
// @desc    Upload an image for banner (saves base64 to assets/images/banners or returns url)
router.post('/upload', async (req, res) => {
  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    // Extract base64 payload
    const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it's already a regular URL or data
      return res.json({ success: true, imageUrl: imageBase64 });
    }

    const ext = matches[1].split('/')[1] || 'jpg';
    const cleanFileName = `banner_${Date.now()}_${Math.round(Math.random() * 1000)}.${ext}`;
    const uploadDir = path.join(__dirname, '../../assets/images/banners');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, cleanFileName);
    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `assets/images/banners/${cleanFileName}`;
    res.json({ success: true, imageUrl: relativeUrl });
  } catch (error) {
    console.error('Error uploading banner image:', error);
    res.status(500).json({ success: false, message: 'Error uploading image', error: error.message });
  }
});

module.exports = router;
