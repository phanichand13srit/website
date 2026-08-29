const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');

// @route   GET /api/collections
// @desc    Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({}).sort({ createdAt: -1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving collections', error: error.message });
  }
});

// @route   POST /api/collections
// @desc    Create a collection (Admin)
router.post('/', async (req, res) => {
  try {
    const { title, name, description, image, collectionType, conditionsSummary, subcategories } = req.body;
    const colTitle = (title || name || '').trim();
    
    if (!colTitle) {
      return res.status(400).json({ success: false, message: 'Collection title is required' });
    }

    // Parse subcategories if sent as comma-separated string or array
    let parsedSubs = [];
    if (Array.isArray(subcategories)) {
      parsedSubs = subcategories.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof subcategories === 'string' && subcategories.trim()) {
      parsedSubs = subcategories.split(',').map(s => s.trim()).filter(Boolean);
    }

    const collection = new Collection({
      title: colTitle,
      slug: colTitle.toLowerCase().replace(/\s+/g, '-'),
      description: description || '',
      image: image || '',
      subcategories: parsedSubs,
      collectionType: collectionType || 'manual',
      conditionsSummary: conditionsSummary || `Tag includes ${colTitle}`,
    });

    const saved = await collection.save();
    console.log(`✅ Saved new collection to MongoDB: "${saved.title}" (ID: ${saved._id})`);
    
    const savedObj = saved.toObject();
    res.status(201).json({ success: true, data: savedObj, ...savedObj });
  } catch (error) {
    console.error('❌ Error saving collection to MongoDB:', error.message);
    res.status(400).json({ success: false, message: 'Error creating collection', error: error.message });
  }
});

// =========================================================================
// BULK OPERATIONS (MUST BE DEFINED BEFORE /:id ROUTES)
// =========================================================================

// @route   POST /api/collections/bulk-delete
// @desc    Bulk delete collections (Admin)
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of collection IDs' });
    }
    const result = await Collection.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `Successfully deleted ${result.deletedCount} collections`, count: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error performing bulk collection delete', error: error.message });
  }
});

// =========================================================================
// PARAMETERIZED /:id ROUTES
// =========================================================================

// @route   GET /api/collections/:id
// @desc    Get single collection by ID
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }
    const colObj = collection.toObject();
    res.json({ success: true, data: colObj, ...colObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving collection', error: error.message });
  }
});

// @route   PUT /api/collections/:id
// @desc    Update a collection & its subcategories (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { title, name, description, image, collectionType, conditionsSummary, subcategories } = req.body;
    const colTitle = (title || name || '').trim();

    let parsedSubs = undefined;
    if (Array.isArray(subcategories)) {
      parsedSubs = subcategories.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof subcategories === 'string' && subcategories.trim()) {
      parsedSubs = subcategories.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updateData = {
      ...(colTitle && { title: colTitle, slug: colTitle.toLowerCase().replace(/\s+/g, '-') }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(collectionType && { collectionType }),
      ...(conditionsSummary !== undefined && { conditionsSummary }),
      ...(parsedSubs !== undefined && { subcategories: parsedSubs })
    };

    const updated = await Collection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Collection not found to update' });
    }

    const updatedObj = updated.toObject();
    res.json({ success: true, data: updatedObj, ...updatedObj });
  } catch (error) {
    console.error('❌ Error updating collection in MongoDB:', error.message);
    res.status(400).json({ success: false, message: 'Error updating collection', error: error.message });
  }
});

// @route   DELETE /api/collections/:id
// @desc    Delete a collection (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Collection.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting collection', error: error.message });
  }
});

module.exports = router;
