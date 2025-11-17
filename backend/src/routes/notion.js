import express from 'express';
import notionService from '../services/notion.service.js';

const router = express.Router();

// Test Notion API connection
router.get('/test', async (req, res) => {
  try {
    const result = await notionService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a single page
router.post('/create', async (req, res) => {
  try {
    const result = await notionService.createPage(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch create pages
router.post('/create/batch', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const result = await notionService.batchCreate(items);
    res.json({
      total: items.length,
      succeeded: result.succeeded.length,
      failed: result.failed.length,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check for duplicate
router.post('/check-duplicate', async (req, res) => {
  try {
    const { sourceUrl } = req.body;

    if (!sourceUrl) {
      return res.status(400).json({ error: 'sourceUrl is required' });
    }

    const isDuplicate = await notionService.checkDuplicate(sourceUrl);
    res.json({ isDuplicate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
