const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');

// Default Tiered Coupons list
const DEFAULT_COUPONS = [
  {
    code: 'SAVE10',
    discountPercent: 10,
    minOrderAmount: 1000,
    description: '10% OFF on orders above ₹1,000',
    isActive: true,
  },
  {
    code: 'SAVE15',
    discountPercent: 15,
    minOrderAmount: 3000,
    description: '15% OFF on orders above ₹3,000',
    isActive: true,
  },
  {
    code: 'SAVE20',
    discountPercent: 20,
    minOrderAmount: 5000,
    description: '20% OFF on orders above ₹5,000',
    isActive: true,
  },
  {
    code: 'SAVE50',
    discountPercent: 50,
    minOrderAmount: 10000,
    description: '50% MEGA DISCOUNT on orders above ₹10,000',
    isActive: true,
  },
  {
    code: 'ARSHITH10',
    discountPercent: 10,
    minOrderAmount: 1000,
    description: '10% Welcome Discount above ₹1,000',
    isActive: true,
  },
  {
    code: 'ARSHITH15',
    discountPercent: 15,
    minOrderAmount: 3000,
    description: '15% Special Discount above ₹3,000',
    isActive: true,
  },
  {
    code: 'ARSHITH20',
    discountPercent: 20,
    minOrderAmount: 5000,
    description: '20% Festive Discount above ₹5,000',
    isActive: true,
  },
  {
    code: 'ARSHITH50',
    discountPercent: 50,
    minOrderAmount: 10000,
    description: '50% Royal Discount above ₹10,000',
    isActive: true,
  },
  {
    code: 'MEGA50',
    discountPercent: 50,
    minOrderAmount: 10000,
    description: '50% Super Saver on orders above ₹10,000',
    isActive: true,
  }
];

// Helper to seed if database has no coupons
async function ensureDefaultCoupons() {
  try {
    const count = await Coupon.countDocuments({});
    if (count === 0) {
      await Coupon.insertMany(DEFAULT_COUPONS);
    }
  } catch (err) {
    // If DB fails, in-memory fallback will handle it
  }
}

// @route   GET /api/coupons
// @desc    Get all active coupons for storefront
router.get('/', async (req, res) => {
  try {
    await ensureDefaultCoupons();
    const coupons = await Coupon.find({ isActive: true }).sort({ minOrderAmount: 1 });
    if (!coupons || coupons.length === 0) {
      return res.json(DEFAULT_COUPONS.filter(c => c.isActive));
    }
    res.json(coupons);
  } catch (error) {
    res.json(DEFAULT_COUPONS.filter(c => c.isActive));
  }
});

// @route   GET /api/coupons/all
// @desc    Get all coupons (active & inactive) for Admin Management
router.get('/all', async (req, res) => {
  try {
    await ensureDefaultCoupons();
    const coupons = await Coupon.find({}).sort({ minOrderAmount: 1 });
    if (!coupons || coupons.length === 0) {
      return res.json(DEFAULT_COUPONS);
    }
    res.json(coupons);
  } catch (error) {
    res.json(DEFAULT_COUPONS);
  }
});

// @route   GET /api/coupons/:id
// @desc    Get single coupon by ID
router.get('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, data: coupon, ...coupon.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving coupon', error: error.message });
  }
});

// @route   POST /api/coupons
// @desc    Create a new coupon (Admin)
router.post('/', async (req, res) => {
  try {
    const { code, discountPercent, minOrderAmount, description, isActive } = req.body;
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    if (!discountPercent || Number(discountPercent) <= 0 || Number(discountPercent) > 100) {
      return res.status(400).json({ success: false, message: 'Discount percentage must be between 1 and 100' });
    }

    // Check if code already exists
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" already exists` });
    }

    const newCoupon = new Coupon({
      code: cleanCode,
      discountPercent: Number(discountPercent),
      minOrderAmount: Number(minOrderAmount) || 0,
      description: description || `${discountPercent}% OFF on orders above ₹${Number(minOrderAmount) || 0}`,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    const saved = await newCoupon.save();
    res.status(201).json({ success: true, message: 'Coupon created successfully!', data: saved, ...saved.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating coupon', error: error.message });
  }
});

// @route   PUT /api/coupons/:id
// @desc    Update a coupon (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { code, discountPercent, minOrderAmount, description, isActive } = req.body;
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (code) coupon.code = code.trim().toUpperCase();
    if (discountPercent !== undefined) coupon.discountPercent = Number(discountPercent);
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount);
    if (description !== undefined) coupon.description = description;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    const updated = await coupon.save();
    res.json({ success: true, message: 'Coupon updated successfully!', data: updated, ...updated.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating coupon', error: error.message });
  }
});

// @route   DELETE /api/coupons/:id
// @desc    Delete a coupon (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting coupon', error: error.message });
  }
});

// @route   POST /api/coupons/validate
// @desc    Validate a coupon code against cart subtotal
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const cleanCode = (code || '').trim().toUpperCase();
    const numSubtotal = Number(subtotal) || 0;

    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    // Try MongoDB query first
    let coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

    // Fallback to default in-memory list if not found in DB
    if (!coupon) {
      coupon = DEFAULT_COUPONS.find(c => c.code === cleanCode && c.isActive);
    }

    // Additional generic code alias mapping
    if (!coupon) {
      if (['FESTIVE10', 'WELCOME10', 'BILL1000', '10OFF', 'DISCOUNT10'].includes(cleanCode)) {
        coupon = { code: cleanCode, discountPercent: 10, minOrderAmount: 1000, description: '10% OFF on orders above ₹1,000' };
      } else if (['BILL3000', '15OFF', 'DISCOUNT15'].includes(cleanCode)) {
        coupon = { code: cleanCode, discountPercent: 15, minOrderAmount: 3000, description: '15% OFF on orders above ₹3,000' };
      } else if (['SUPER20', 'BILL5000', '20OFF', 'DISCOUNT20'].includes(cleanCode)) {
        coupon = { code: cleanCode, discountPercent: 20, minOrderAmount: 5000, description: '20% OFF on orders above ₹5,000' };
      } else if (['BILL10000', '50OFF', 'DISCOUNT50'].includes(cleanCode)) {
        coupon = { code: cleanCode, discountPercent: 50, minOrderAmount: 10000, description: '50% OFF on orders above ₹10,000' };
      }
    }

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon code. Try SAVE10, SAVE15, SAVE20, or SAVE50!'
      });
    }

    // Check minimum order amount
    if (numSubtotal < coupon.minOrderAmount) {
      const remaining = coupon.minOrderAmount - numSubtotal;
      return res.status(400).json({
        success: false,
        message: `Coupon "${coupon.code}" requires a minimum order of ₹${coupon.minOrderAmount.toLocaleString('en-IN')}. Add ₹${remaining.toLocaleString('en-IN')} more to unlock ${coupon.discountPercent}% OFF!`,
        minOrderAmount: coupon.minOrderAmount,
        remaining
      });
    }

    // Calculate discount amount
    const discountAmount = Math.round((numSubtotal * coupon.discountPercent) / 100 * 100) / 100;
    const finalTotal = Math.max(0, numSubtotal - discountAmount);

    return res.json({
      success: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount,
      minOrderAmount: coupon.minOrderAmount,
      finalTotal,
      message: `🎉 Coupon "${coupon.code}" applied! You saved ${coupon.discountPercent}% (-₹${discountAmount.toFixed(2)}).`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error validating coupon', error: error.message });
  }
});

module.exports = router;
