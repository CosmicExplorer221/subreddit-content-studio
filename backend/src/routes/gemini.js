import express from 'express';
import geminiService from '../services/gemini.service.js';

const router = express.Router();

// Test Gemini API connection
router.get('/test', async (req, res) => {
  try {
    const result = await geminiService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate LinkedIn post
router.post('/generate', async (req, res) => {
  try {
    const { context, styleGuidelines } = req.body;

    if (!context || !styleGuidelines) {
      return res.status(400).json({
        error: 'Context and styleGuidelines are required'
      });
    }

    const result = await geminiService.generateLinkedInPost(context, styleGuidelines);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch generate posts
router.post('/generate/batch', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const results = await Promise.allSettled(
      items.map(item =>
        geminiService.generateLinkedInPost(item.context, item.styleGuidelines)
      )
    );

    const response = {
      total: items.length,
      succeeded: 0,
      failed: 0,
      results: []
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        response.succeeded++;
        response.results.push({
          index,
          success: true,
          ...result.value
        });
      } else {
        response.failed++;
        response.results.push({
          index,
          success: false,
          error: result.reason.message
        });
      }
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
