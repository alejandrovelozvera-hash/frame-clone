import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'frame-clone.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
    password TEXT NOT NULL, avatar_url TEXT, created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
    owner_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'viewer',
    joined_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL,
    original_name TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL,
    duration REAL, width INTEGER, height INTEGER, framerate REAL,
    thumbnail_path TEXT, status TEXT DEFAULT 'ready', version INTEGER DEFAULT 1,
    uploaded_by TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY, file_id TEXT NOT NULL, version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL, thumbnail_path TEXT, size INTEGER NOT NULL,
    duration REAL, width INTEGER, height INTEGER, uploaded_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY, file_id TEXT NOT NULL, user_id TEXT NOT NULL,
    parent_id TEXT, content TEXT NOT NULL, timecode REAL,
    status TEXT DEFAULT 'active', resolved_at TEXT, resolved_by TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (file_id) REFERENCES files(id), FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id), FOREIGN KEY (resolved_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY, file_id TEXT NOT NULL, user_id TEXT NOT NULL,
    timecode REAL NOT NULL, type TEXT NOT NULL, data TEXT NOT NULL,
    color TEXT DEFAULT '#FF0000', stroke_width REAL DEFAULT 2,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (file_id) REFERENCES files(id), FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY, file_id TEXT NOT NULL, reviewer_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', decision TEXT, feedback TEXT,
    created_at TEXT DEFAULT (datetime('now')), completed_at TEXT,
    FOREIGN KEY (file_id) REFERENCES files(id), FOREIGN KEY (reviewer_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL,
    message TEXT NOT NULL, data TEXT, read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

export default db;
