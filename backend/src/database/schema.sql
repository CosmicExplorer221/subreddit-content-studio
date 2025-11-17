-- Posts table: Track fetched Reddit posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  reddit_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  category_id TEXT NOT NULL,
  author TEXT,
  url TEXT NOT NULL,
  permalink TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  created_utc INTEGER NOT NULL,
  post_type TEXT CHECK(post_type IN ('image', 'video', 'link', 'text')) NOT NULL,
  thumbnail TEXT,
  media_url TEXT,
  selftext TEXT,
  upvote_ratio REAL,
  is_downloaded BOOLEAN DEFAULT 0,
  is_processed BOOLEAN DEFAULT 0,
  processed_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Comments table: Store top comments for each post
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  reddit_comment_id TEXT NOT NULL,
  author TEXT,
  body TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_utc INTEGER NOT NULL,
  is_submitter BOOLEAN DEFAULT 0,
  depth INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Downloads table: Track downloaded media files
CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  download_status TEXT CHECK(download_status IN ('pending', 'downloading', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  completed_at INTEGER,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Generated posts table: Store AI-generated LinkedIn content
CREATE TABLE IF NOT EXISTS generated_posts (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  content TEXT NOT NULL,
  style_template_id TEXT NOT NULL,
  model_used TEXT,
  generation_params TEXT, -- JSON string
  word_count INTEGER,
  is_edited BOOLEAN DEFAULT 0,
  edited_content TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Notion uploads table: Track uploads to Notion
CREATE TABLE IF NOT EXISTS notion_uploads (
  id TEXT PRIMARY KEY,
  generated_post_id TEXT NOT NULL,
  notion_page_id TEXT,
  upload_status TEXT CHECK(upload_status IN ('pending', 'uploading', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  completed_at INTEGER,
  FOREIGN KEY (generated_post_id) REFERENCES generated_posts(id) ON DELETE CASCADE
);

-- Category presets table: User-saved category configurations
CREATE TABLE IF NOT EXISTS category_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config TEXT NOT NULL, -- JSON string with category settings
  is_active BOOLEAN DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Analytics table: Track performance metrics
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- e.g., 'subreddit_performance', 'category_performance'
  metric_data TEXT NOT NULL, -- JSON string
  recorded_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_subreddit ON posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_posts_processed ON posts(is_processed);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_utc);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_downloads_post ON downloads(post_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_post ON generated_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_notion_uploads_generated ON notion_uploads(generated_post_id);
