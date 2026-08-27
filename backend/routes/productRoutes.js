const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Helper to format product consistently for both frontend storefront & admin dashboards
function formatProduct(p) {
  const obj = p.toObject ? p.toObject() : { ...p };
  obj.title = obj.title || obj.name || 'Untitled Product';
  obj.name = obj.name || obj.title || 'Untitled Product';

  if (Array.isArray(obj.images) && obj.images.length > 0) {
    obj.images = obj.images.map(img => typeof img === 'object' ? img : { url: img }).filter(img => img && img.url);
    if (!obj.image && obj.images[0]) {
      obj.image = obj.images[0].url;
    }
  } else if (obj.image) {
    obj.images = [{ url: obj.image }];
  } else {
    obj.images = [{ url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&auto=format&fit=crop&q=60' }];
  }
  return obj;
}

// @route   GET /api/products
// @desc    Get all products (with optional keyword search & category filter)
router.get('/', async (req, res) => {
  try {
    const { keyword, category } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products.map(formatProduct));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID or slug/name
router.get('/:id', async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    let product = null;

    // 1. If valid 24-char ObjectId, find by MongoDB ID
    if (rawId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(rawId);
    }

    // 2. If not found by ID or if slug was passed (e.g. groundnut-oil-premium, coconut-oil)
    if (!product && rawId) {
      const cleanSlug = rawId.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      const firstWord = cleanSlug.split(' ')[0];

      product = await Product.findOne({
        $or: [
          { name: { $regex: cleanSlug, $options: 'i' } },
          { name: { $regex: firstWord, $options: 'i' } },
          { tags: { $in: [cleanSlug, firstWord, rawId] } },
          { category: { $regex: cleanSlug, $options: 'i' } }
        ]
      });
    }

    // 3. If still not found, return the first available product as a safe fallback
    if (!product) {
      product = await Product.findOne();
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(formatProduct(product));
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product', error: error.message });
  }
});

// @route   POST /api/products
// @desc    Create a new product (Admin)
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };

    // Support field aliases
    if (!data.name && data.title) {
      data.name = data.title;
    }
    if (!data.name) {
      data.name = 'New Product';
    }
    if (!data.category) {
      data.category = data.type || data.productType || 'General';
    }
    if (data.price === undefined || data.price === null || isNaN(Number(data.price))) {
      data.price = 0;
    } else {
      data.price = Number(data.price);
    }

    // Normalize images array
    if (Array.isArray(data.images)) {
      data.images = data.images.map(img => {
        if (typeof img === 'string') return { url: img };
        return { url: img.url || '', alt: img.alt || '' };
      }).filter(img => img.url && img.url.trim());

      if (data.images.length > 0 && !data.image) {
        data.image = data.images[0].url;
      }
    } else if (data.image) {
      data.images = [{ url: data.image }];
    }

    const newProduct = new Product(data);
    const savedProduct = await newProduct.save();
    res.status(201).json(formatProduct(savedProduct));
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: 'Error creating product', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update an existing product (Admin)
router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.name && data.title) {
      data.name = data.title;
    }
    if (data.price !== undefined && !isNaN(Number(data.price))) {
      data.price = Number(data.price);
    }

    // Normalize images array
    if (Array.isArray(data.images)) {
      data.images = data.images.map(img => {
        if (typeof img === 'string') return { url: img };
        return { url: img.url || '', alt: img.alt || '' };
      }).filter(img => img.url && img.url.trim());

      if (data.images.length > 0) {
        data.image = data.images[0].url;
      }
    } else if (data.image) {
      data.images = [{ url: data.image }];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found to update' });
    }
    res.json(formatProduct(updatedProduct));
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found to delete' });
    }
    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;
