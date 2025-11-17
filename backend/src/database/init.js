import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../../backend/data/app.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

export function initializeDatabase() {
  console.log('Initializing database...');

  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  console.log('Database initialized successfully at:', DB_PATH);

  return db;
}

export function getDatabase() {
  if (!existsSync(DB_PATH)) {
    return initializeDatabase();
  }

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  return db;
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
  process.exit(0);
}
