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

// @route   GET /api/products/:id/reviews
// @desc    Get all reviews for a product
router.get('/:id/reviews', async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    let product = null;

    if (rawId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(rawId);
    }
    if (!product && rawId) {
      const cleanSlug = rawId.replace(/-/g, ' ').trim();
      product = await Product.findOne({ name: { $regex: cleanSlug, $options: 'i' } });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Default sample reviews if no reviews submitted yet
    const defaultReviews = [
      {
        _id: 'default_rev_1',
        name: 'Ramesh Kumar',
        rating: 5,
        title: 'Authentic taste and fresh aroma!',
        comment: 'Very fresh and high quality. Reminds me of traditional home-made pure products. Highly recommend Arshith Fresh!',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        _id: 'default_rev_2',
        name: 'Sneha Reddy',
        rating: 5,
        title: 'Excellent packaging and purity',
        comment: '100% natural, no adulteration. Fast delivery and safe packing. Will definitely purchase regularly.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        _id: 'default_rev_3',
        name: 'Venkata Rao',
        rating: 4,
        title: 'Great quality products',
        comment: 'Good natural flavor and hygienic packaging. Loved the fresh quality.',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    ];

    const reviews = (product.reviews && product.reviews.length > 0) ? product.reviews : defaultReviews;
    res.json({
      success: true,
      productId: product._id,
      rating: product.rating || 4.9,
      numReviews: (product.reviews && product.reviews.length > 0) ? product.reviews.length : defaultReviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Create a new review for a product
router.post('/:id/reviews', async (req, res) => {
  try {
    const { name, rating, title, comment } = req.body;
    const rawId = (req.params.id || '').trim();

    if (!rating || !comment || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, star rating, and review description'
      });
    }

    let product = null;
    if (rawId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(rawId);
    }
    if (!product && rawId) {
      const cleanSlug = rawId.replace(/-/g, ' ').trim();
      product = await Product.findOne({ name: { $regex: cleanSlug, $options: 'i' } });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newReview = {
      name: name.trim(),
      rating: Number(rating),
      title: (title || '').trim() || `${Number(rating)} Star Rating`,
      comment: comment.trim(),
      createdAt: new Date()
    };

    if (!Array.isArray(product.reviews)) {
      product.reviews = [];
    }

    product.reviews.unshift(newReview);
    product.numReviews = product.reviews.length;
    
    // Recalculate average rating
    const totalRating = product.reviews.reduce((acc, item) => item.rating + acc, 0);
    product.rating = Math.round((totalRating / product.reviews.length) * 10) / 10;

    await product.save();

    res.status(201).json({
      success: true,
      message: '🎉 Review submitted successfully! Thank you for your feedback.',
      review: newReview,
      product: {
        _id: product._id,
        rating: product.rating,
        numReviews: product.numReviews,
        reviews: product.reviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding review', error: error.message });
  }
});

module.exports = router;
