import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const STYLES_FILE = join(__dirname, '../../config/styles.json');

// Helper to read styles
function readStyles() {
  const data = readFileSync(STYLES_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper to write styles
function writeStyles(data) {
  writeFileSync(STYLES_FILE, JSON.stringify(data, null, 2));
}

// Get all style templates
router.get('/', (req, res) => {
  try {
    const data = readStyles();
    res.json(data.templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single template
router.get('/:id', (req, res) => {
  try {
    const data = readStyles();
    const template = data.templates.find(t => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get templates for a specific category
router.get('/category/:categoryId', (req, res) => {
  try {
    const data = readStyles();
    const templates = data.templates.filter(
      t => t.categoryIds.includes(req.params.categoryId) || t.categoryIds.length === 0
    );

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new template
router.post('/', (req, res) => {
  try {
    const data = readStyles();
    const newTemplate = {
      id: req.body.id || `template-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check for duplicate ID
    if (data.templates.find(t => t.id === newTemplate.id)) {
      return res.status(400).json({ error: 'Template ID already exists' });
    }

    data.templates.push(newTemplate);
    writeStyles(data);

    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a template
router.put('/:id', (req, res) => {
  try {
    const data = readStyles();
    const index = data.templates.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }

    data.templates[index] = {
      ...data.templates[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    writeStyles(data);
    res.json(data.templates[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a template
router.delete('/:id', (req, res) => {
  try {
    const data = readStyles();
    const index = data.templates.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }

    data.templates.splice(index, 1);
    writeStyles(data);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
