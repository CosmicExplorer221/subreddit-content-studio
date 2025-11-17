import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import redditService from '../services/reddit.service.js';
import geminiService from '../services/gemini.service.js';
import notionService from '../services/notion.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const SETTINGS_FILE = join(__dirname, '../../config/settings.json');
const SETTINGS_EXAMPLE = join(__dirname, '../../config/settings.example.json');

// Helper to read settings
function readSettings() {
  let filePath = SETTINGS_FILE;

  // If settings.json doesn't exist, use example file
  if (!existsSync(SETTINGS_FILE)) {
    if (existsSync(SETTINGS_EXAMPLE)) {
      filePath = SETTINGS_EXAMPLE;
    } else {
      return { error: 'Settings file not found' };
    }
  }

  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Helper to write settings
function writeSettings(data) {
  writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

// Get all settings (sanitized - no API keys)
router.get('/', (req, res) => {
  try {
    const settings = readSettings();

    if (settings.error) {
      return res.status(404).json(settings);
    }

    // Sanitize API keys
    const sanitized = {
      ...settings,
      reddit: {
        ...settings.reddit,
        clientSecret: settings.reddit.clientSecret ? '***' : '',
        refreshToken: settings.reddit.refreshToken ? '***' : ''
      },
      gemini: {
        ...settings.gemini,
        apiKey: settings.gemini.apiKey ? '***' : ''
      },
      notion: {
        ...settings.notion,
        apiKey: settings.notion.apiKey ? '***' : ''
      }
    };

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.put('/', (req, res) => {
  try {
    const currentSettings = readSettings();
    const newSettings = {
      ...currentSettings,
      ...req.body
    };

    writeSettings(newSettings);
    res.json({ success: true, message: 'Settings updated. Please restart the server for changes to take effect.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test all API connections
router.get('/test-connections', async (req, res) => {
  try {
    const results = await Promise.allSettled([
      redditService.testConnection(),
      geminiService.testConnection(),
      notionService.testConnection()
    ]);

    const response = {
      reddit: results[0].status === 'fulfilled' ? results[0].value : { success: false, message: results[0].reason.message },
      gemini: results[1].status === 'fulfilled' ? results[1].value : { success: false, message: results[1].reason.message },
      notion: results[2].status === 'fulfilled' ? results[2].value : { success: false, message: results[2].reason.message }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
