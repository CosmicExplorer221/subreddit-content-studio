import express from 'express';
import redditService from '../services/reddit.service.js';

const router = express.Router();

// Test Reddit API connection
router.get('/test', async (req, res) => {
  try {
    const result = await redditService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch posts from a single subreddit
router.get('/posts/:subreddit', async (req, res) => {
  try {
    const { subreddit } = req.params;
    const { timeFilter, limit, sortBy } = req.query;

    const posts = await redditService.fetchPosts(subreddit, {
      timeFilter: timeFilter || 'week',
      limit: parseInt(limit) || 50,
      sortBy: sortBy || 'hot'
    });

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch posts from multiple subreddits
router.post('/posts/batch', async (req, res) => {
  try {
    const { subreddits, timeFilter, limit, sortBy } = req.body;

    if (!Array.isArray(subreddits) || subreddits.length === 0) {
      return res.status(400).json({ error: 'Subreddits array is required' });
    }

    const result = await redditService.fetchMultiplePosts(subreddits, {
      timeFilter: timeFilter || 'week',
      limit: parseInt(limit) || 50,
      sortBy: sortBy || 'hot'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch comments for a post
router.get('/comments/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit } = req.query;

    const comments = await redditService.fetchComments(
      postId,
      parseInt(limit) || 15
    );

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
