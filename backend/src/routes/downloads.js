import express from 'express';
import downloadService from '../services/download.service.js';
import { getDatabase } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Download media for a single post
router.post('/single', async (req, res) => {
  try {
    const { post, category } = req.body;

    if (!post || !category) {
      return res.status(400).json({ error: 'Post and category are required' });
    }

    const result = await downloadService.downloadMedia(post, category);

    // Save download record to database
    if (result.success) {
      const db = getDatabase();
      const postRecord = db.prepare('SELECT id FROM posts WHERE reddit_id = ?').get(post.id);

      if (postRecord) {
        db.prepare(`
          INSERT INTO downloads (
            id, post_id, file_path, file_name, file_type, file_size, download_status, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          postRecord.id,
          result.filePath,
          result.fileName,
          result.fileType,
          result.fileSize,
          'completed',
          Math.floor(Date.now() / 1000)
        );

        // Mark post as downloaded
        db.prepare('UPDATE posts SET is_downloaded = 1, updated_at = ? WHERE id = ?')
          .run(Math.floor(Date.now() / 1000), postRecord.id);
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch download media for multiple posts
router.post('/batch', async (req, res) => {
  try {
    const { posts, category } = req.body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'Posts array is required' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Set up SSE for progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await downloadService.batchDownload(posts, category, (progress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    });

    // Save successful downloads to database
    const db = getDatabase();
    for (const downloadResult of result.results) {
      if (downloadResult.success) {
        const postRecord = db.prepare('SELECT id FROM posts WHERE reddit_id = ?').get(downloadResult.postId);

        if (postRecord) {
          db.prepare(`
            INSERT INTO downloads (
              id, post_id, file_path, file_name, file_type, file_size, download_status, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            postRecord.id,
            downloadResult.filePath,
            downloadResult.fileName,
            downloadResult.fileType,
            downloadResult.fileSize,
            'completed',
            Math.floor(Date.now() / 1000)
          );

          db.prepare('UPDATE posts SET is_downloaded = 1, updated_at = ? WHERE id = ?')
            .run(Math.floor(Date.now() / 1000), postRecord.id);
        }
      }
    }

    // Send final result
    res.write(`data: ${JSON.stringify({ ...result, complete: true })}\n\n`);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get download status
router.get('/status', (req, res) => {
  try {
    const stats = downloadService.getDownloadStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get downloads for a post
router.get('/post/:postId', (req, res) => {
  try {
    const db = getDatabase();
    const post = db.prepare('SELECT id FROM posts WHERE reddit_id = ?').get(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const downloads = db.prepare('SELECT * FROM downloads WHERE post_id = ?').all(post.id);
    res.json({ downloads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
