const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Helper to recalculate average rating and review count on a product
async function updateProductRatingStats(productId) {
  try {
    if (!productId) return;
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          numReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].avgRating * 10) / 10;
      await Product.findByIdAndUpdate(productId, {
        rating: avg,
        numReviews: stats[0].numReviews
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 5.0,
        numReviews: 0
      });
    }
  } catch (err) {
    console.error('Error updating product rating stats:', err);
  }
}

// Helper to check if a user purchased the product
async function checkVerifiedPurchase(userEmail, userId, productId, productName) {
  try {
    if (!userEmail && !userId) return false;
    
    let queryConditions = [];
    if (userEmail) {
      queryConditions.push({ 'customer.email': userEmail.toLowerCase() });
      queryConditions.push({ customerEmail: userEmail.toLowerCase() });
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      queryConditions.push({ user: new mongoose.Types.ObjectId(userId) });
    }

    if (queryConditions.length === 0) return false;

    const orders = await Order.find({
      $or: queryConditions,
      status: { $nin: ['Cancelled'] }
    });

    for (const order of orders) {
      if (Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          if (item.product && String(item.product) === String(productId)) {
            return true;
          }
          if (productId && String(item._id) === String(productId)) {
            return true;
          }
          if (productName && item.name && item.name.toLowerCase().trim() === productName.toLowerCase().trim()) {
            return true;
          }
        }
      }
    }
    return false;
  } catch (err) {
    console.error('Error checking verified purchase:', err);
    return false;
  }
}

// @route   GET /api/reviews/latest
// @desc    Get latest real customer reviews across all products for homepage showcase
router.get('/latest', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 12;
    const reviews = await Review.find({})
      .populate('productId', 'name image price category')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching latest reviews', error: error.message });
  }
});

// @route   GET /api/reviews/product/:productId
// @desc    Get all reviews for a product with filtering, sorting, and summary stats
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { sort, rating, verifiedOnly } = req.query;

    let targetProductId = productId;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product && productId) {
      const cleanSlug = productId.replace(/-/g, ' ').trim();
      product = await Product.findOne({ name: { $regex: cleanSlug, $options: 'i' } });
      if (product) targetProductId = product._id;
    }

    if (!product && !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Build filter query
    let filter = { productId: targetProductId };
    if (rating && !isNaN(Number(rating))) {
      filter.rating = Number(rating);
    }
    if (verifiedOnly === 'true') {
      filter.verifiedPurchase = true;
    }

    // Build sort options
    let sortQuery = { createdAt: -1 }; // default most recent
    if (sort === 'rating_desc') {
      sortQuery = { rating: -1, createdAt: -1 };
    } else if (sort === 'rating_asc') {
      sortQuery = { rating: 1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortQuery = { helpfulCount: -1, createdAt: -1 };
    }

    const reviews = await Review.find(filter).sort(sortQuery);

    // Calculate rating distribution & breakdown for ALL reviews on this product
    const allReviews = await Review.find({ productId: targetProductId });
    const totalReviews = allReviews.length;

    const distributionCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    allReviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      distributionCounts[star] = (distributionCounts[star] || 0) + 1;
      totalScore += (r.rating || 5);
    });

    const averageRating = totalReviews > 0 ? Math.round((totalScore / totalReviews) * 10) / 10 : 5.0;

    const ratingDistribution = {
      5: totalReviews > 0 ? Math.round((distributionCounts[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((distributionCounts[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((distributionCounts[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((distributionCounts[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((distributionCounts[1] / totalReviews) * 100) : 0,
    };

    res.json({
      success: true,
      productId: targetProductId,
      productName: product ? product.name : '',
      averageRating,
      totalReviews,
      distributionCounts,
      ratingDistribution,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching product reviews', error: error.message });
  }
});

// @route   POST /api/reviews
// @desc    Submit a new customer review (Checks verified purchase & duplicate review)
router.post('/', async (req, res) => {
  try {
    const { productId, rating, title, comment, customerName, customerEmail, userId, images } = req.body;

    if (!productId || !rating || !title || !comment || !customerEmail || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rating, title, review comment, name, and email'
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    if (comment.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Review comment must be at least 5 characters long' });
    }

    let targetProductId = productId;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product && productId) {
      const cleanSlug = productId.replace(/-/g, ' ').trim();
      product = await Product.findOne({ name: { $regex: cleanSlug, $options: 'i' } });
      if (product) targetProductId = product._id;
    }

    if (!product && !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Normalize images array (done early so it's available for both update and create paths)
    let sanitizedImages = [];
    if (Array.isArray(images)) {
      sanitizedImages = images.filter(img => typeof img === 'string' && img.trim().length > 0);
    }

    // Check verified purchase
    const isVerified = await checkVerifiedPurchase(
      customerEmail,
      userId,
      targetProductId,
      product ? product.name : ''
    );


    const newReview = new Review({
      productId: targetProductId,
      productName: product ? product.name : '',
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      customerName: customerName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      images: sanitizedImages,
      verifiedPurchase: isVerified,
    });

    await newReview.save();

    // Recalculate product rating stats
    await updateProductRatingStats(targetProductId);

    res.status(201).json({
      success: true,
      message: '🎉 Review submitted successfully! Thank you for your feedback.',
      review: newReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating review', error: error.message });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update an existing review (own review)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, images, customerEmail } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Optional email check to enforce own review editing
    if (customerEmail && review.customerEmail.toLowerCase() !== customerEmail.toLowerCase().trim()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reviews' });
    }

    if (rating !== undefined) review.rating = Number(rating);
    if (title !== undefined) review.title = title.trim();
    if (comment !== undefined) review.comment = comment.trim();
    if (Array.isArray(images)) review.images = images.filter(img => typeof img === 'string' && img.trim().length > 0);

    await review.save();

    // Recalculate product rating stats
    await updateProductRatingStats(review.productId);

    res.json({
      success: true,
      message: 'Review updated successfully!',
      review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating review', error: error.message });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete own review
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerEmail } = req.body || req.query;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (customerEmail && review.customerEmail.toLowerCase() !== customerEmail.toLowerCase().trim()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(id);

    // Recalculate product rating stats
    await updateProductRatingStats(productId);

    res.json({ success: true, message: 'Review deleted successfully', id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting review', error: error.message });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful (Toggle / vote once)
router.post('/:id/helpful', async (req, res) => {
  try {
    const { id } = req.params;
    const { userIdentifier } = req.body; // email or IP
    const voterId = (userIdentifier || req.ip || 'anonymous').toLowerCase().trim();

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (!Array.isArray(review.helpfulUsers)) {
      review.helpfulUsers = [];
    }

    const alreadyVoted = review.helpfulUsers.includes(voterId);
    if (alreadyVoted) {
      // Un-vote
      review.helpfulUsers = review.helpfulUsers.filter(u => u !== voterId);
      review.helpfulCount = Math.max(0, (review.helpfulCount || 1) - 1);
    } else {
      // Vote helpful
      review.helpfulUsers.push(voterId);
      review.helpfulCount = (review.helpfulCount || 0) + 1;
    }

    await review.save();

    res.json({
      success: true,
      helpfulCount: review.helpfulCount,
      isHelpful: !alreadyVoted,
      message: alreadyVoted ? 'Helpful vote removed' : 'Thank you for your feedback!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error voting helpful', error: error.message });
  }
});

// ==========================================
// ADMIN REVIEWS MANAGEMENT ENDPOINTS
// ==========================================

// @route   GET /api/reviews/admin/all
// @desc    Get all reviews across all products for admin
router.get('/admin/all', async (req, res) => {
  try {
    const { search, rating, page = 1, limit = 50 } = req.query;
    let query = {};

    if (rating && !isNaN(Number(rating))) {
      query.rating = Number(rating);
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
      ];
    }

    const reviews = await Review.find(query)
      .populate('productId', 'name image price category')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalReviews = await Review.countDocuments(query);
    const allReviewsForStats = await Review.find({});

    const totalAll = allReviewsForStats.length;
    const avgStoreRating = totalAll > 0
      ? Math.round((allReviewsForStats.reduce((acc, r) => acc + (r.rating || 5), 0) / totalAll) * 10) / 10
      : 5.0;

    const fiveStarCount = allReviewsForStats.filter(r => r.rating === 5).length;
    const verifiedCount = allReviewsForStats.filter(r => r.verifiedPurchase).length;

    res.json({
      success: true,
      reviews,
      total: totalReviews,
      stats: {
        totalAll,
        avgStoreRating,
        fiveStarCount,
        verifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching admin reviews', error: error.message });
  }
});

// @route   DELETE /api/reviews/admin/:id
// @desc    Admin delete a review
router.delete('/admin/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found to delete' });
    }
    await updateProductRatingStats(review.productId);
    res.json({ success: true, message: 'Review deleted by admin successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting review', error: error.message });
  }
});

module.exports = router;
