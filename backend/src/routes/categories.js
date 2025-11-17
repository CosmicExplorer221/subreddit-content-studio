import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const CATEGORIES_FILE = join(__dirname, '../../config/categories.json');

// Helper to read categories
function readCategories() {
  const data = readFileSync(CATEGORIES_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper to write categories
function writeCategories(data) {
  writeFileSync(CATEGORIES_FILE, JSON.stringify(data, null, 2));
}

// Get all categories
router.get('/', (req, res) => {
  try {
    const data = readCategories();
    res.json(data.categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single category
router.get('/:id', (req, res) => {
  try {
    const data = readCategories();
    const category = data.categories.find(c => c.id === req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new category
router.post('/', (req, res) => {
  try {
    const data = readCategories();
    const newCategory = {
      id: req.body.id || req.body.name.toLowerCase().replace(/\s+/g, '-'),
      ...req.body
    };

    // Check for duplicate ID
    if (data.categories.find(c => c.id === newCategory.id)) {
      return res.status(400).json({ error: 'Category ID already exists' });
    }

    data.categories.push(newCategory);
    writeCategories(data);

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a category
router.put('/:id', (req, res) => {
  try {
    const data = readCategories();
    const index = data.categories.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    data.categories[index] = {
      ...data.categories[index],
      ...req.body,
      id: req.params.id // Prevent ID change
    };

    writeCategories(data);
    res.json(data.categories[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a category
router.delete('/:id', (req, res) => {
  try {
    const data = readCategories();
    const index = data.categories.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    data.categories.splice(index, 1);
    writeCategories(data);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
