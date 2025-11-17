import express from 'express';
import { getDatabase } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all posts with optional filtering
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { category, subreddit, processed, limit, offset } = req.query;

    let query = 'SELECT * FROM posts WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category_id = ?';
      params.push(category);
    }

    if (subreddit) {
      query += ' AND subreddit = ?';
      params.push(subreddit);
    }

    if (processed !== undefined) {
      query += ' AND is_processed = ?';
      params.push(processed === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_utc DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));

      if (offset) {
        query += ' OFFSET ?';
        params.push(parseInt(offset));
      }
    }

    const posts = db.prepare(query).all(...params);
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single post
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get comments for this post
    const comments = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY score DESC').all(req.params.id);

    res.json({ ...post, comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save Reddit posts to database
router.post('/save', (req, res) => {
  try {
    const { posts, categoryId } = req.body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'Posts array is required' });
    }

    const db = getDatabase();
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO posts (
        id, reddit_id, title, subreddit, category_id, author, url, permalink,
        score, num_comments, created_utc, post_type, thumbnail, media_url,
        selftext, upvote_ratio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    const insertMany = db.transaction((posts) => {
      for (const post of posts) {
        const result = insertStmt.run(
          uuidv4(),
          post.id,
          post.title,
          post.subreddit,
          categoryId,
          post.author,
          post.url,
          post.permalink,
          post.score,
          post.numComments,
          post.createdUtc,
          post.postType,
          post.thumbnail,
          post.mediaUrl,
          post.selftext,
          post.upvoteRatio
        );
        if (result.changes > 0) inserted++;
      }
    });

    insertMany(posts);

    res.json({ inserted, total: posts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save comments for a post
router.post('/:postId/comments', (req, res) => {
  try {
    const { postId } = req.params;
    const { comments } = req.body;

    if (!Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({ error: 'Comments array is required' });
    }

    const db = getDatabase();

    // Check if post exists
    const post = db.prepare('SELECT id FROM posts WHERE reddit_id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO comments (
        id, post_id, reddit_comment_id, author, body, score, created_utc, is_submitter, depth
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    const insertMany = db.transaction((comments) => {
      for (const comment of comments) {
        const result = insertStmt.run(
          uuidv4(),
          post.id,
          comment.id,
          comment.author,
          comment.body,
          comment.score,
          comment.createdUtc,
          comment.isSubmitter ? 1 : 0,
          comment.depth
        );
        if (result.changes > 0) inserted++;
      }
    });

    insertMany(comments);

    res.json({ inserted, total: comments.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark post as processed
router.patch('/:id/processed', (req, res) => {
  try {
    const db = getDatabase();
    const { processed } = req.body;

    const result = db.prepare(`
      UPDATE posts SET is_processed = ?, processed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(
      processed ? 1 : 0,
      processed ? Math.floor(Date.now() / 1000) : null,
      Math.floor(Date.now() / 1000),
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save generated post
router.post('/:postId/generated', (req, res) => {
  try {
    const { postId } = req.params;
    const { content, styleTemplateId, modelUsed, generationParams, isEdited, editedContent } = req.body;

    const db = getDatabase();

    // Check if post exists
    const post = db.prepare('SELECT id FROM posts WHERE reddit_id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const wordCount = content.trim().split(/\s+/).length;

    const result = db.prepare(`
      INSERT INTO generated_posts (
        id, post_id, content, style_template_id, model_used, generation_params,
        word_count, is_edited, edited_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      post.id,
      content,
      styleTemplateId,
      modelUsed,
      JSON.stringify(generationParams),
      wordCount,
      isEdited ? 1 : 0,
      editedContent
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get generated posts
router.get('/:postId/generated', (req, res) => {
  try {
    const { postId } = req.params;
    const db = getDatabase();

    const post = db.prepare('SELECT id FROM posts WHERE reddit_id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const generated = db.prepare('SELECT * FROM generated_posts WHERE post_id = ? ORDER BY created_at DESC').all(post.id);

    res.json({ generated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
