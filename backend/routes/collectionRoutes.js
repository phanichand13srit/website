const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');

// @route   GET /api/collections
// @desc    Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({}).sort({ title: 1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving collections', error: error.message });
  }
});

// @route   GET /api/collections/:id
// @desc    Get single collection by ID
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving collection', error: error.message });
  }
});

// @route   POST /api/collections
// @desc    Create a collection (Admin)
router.post('/', async (req, res) => {
  try {
    const { title, description, image, collectionType, conditionsSummary, subcategories } = req.body;
    
    // Parse subcategories if sent as comma-separated string or array
    let parsedSubs = [];
    if (Array.isArray(subcategories)) {
      parsedSubs = subcategories.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof subcategories === 'string' && subcategories.trim()) {
      parsedSubs = subcategories.split(',').map(s => s.trim()).filter(Boolean);
    }

    const collection = new Collection({
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      description,
      image,
      subcategories: parsedSubs,
      collectionType: collectionType || 'manual',
      conditionsSummary: conditionsSummary || 'All Products',
    });

    const saved = await collection.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: 'Error creating collection', error: error.message });
  }
});

// @route   PUT /api/collections/:id
// @desc    Update a collection & its subcategories (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { title, description, image, collectionType, conditionsSummary, subcategories } = req.body;

    let parsedSubs = undefined;
    if (Array.isArray(subcategories)) {
      parsedSubs = subcategories.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof subcategories === 'string') {
      parsedSubs = subcategories.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updateData = {
      ...(title && { title, slug: title.toLowerCase().replace(/\s+/g, '-') }),
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
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error updating collection', error: error.message });
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
