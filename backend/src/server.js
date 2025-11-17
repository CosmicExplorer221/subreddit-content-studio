import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import redditRoutes from './routes/reddit.js';
import geminiRoutes from './routes/gemini.js';
import notionRoutes from './routes/notion.js';
import categoryRoutes from './routes/categories.js';
import styleRoutes from './routes/styles.js';
import postRoutes from './routes/posts.js';
import downloadRoutes from './routes/downloads.js';
import settingsRoutes from './routes/settings.js';

// Import database
import { initializeDatabase } from './database/init.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure downloads directory exists
const downloadPath = process.env.DOWNLOAD_PATH || './downloads';
const fullDownloadPath = join(__dirname, '../../', downloadPath);
if (!existsSync(fullDownloadPath)) {
  mkdirSync(fullDownloadPath, { recursive: true });
}

// Serve static files from downloads directory
app.use('/downloads', express.static(fullDownloadPath));

// Initialize database
try {
  initializeDatabase();
  console.log('✓ Database initialized');
} catch (error) {
  console.error('✗ Database initialization failed:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/reddit', redditRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/notion', notionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/styles', styleRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Subreddit Content Studio Backend`);
  console.log(`   → Running on http://localhost:${PORT}`);
  console.log(`   → Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   → Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
