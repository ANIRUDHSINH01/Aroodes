import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'aroodes.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    pathway TEXT,
    sequence INTEGER DEFAULT 9,
    lose_control_count INTEGER DEFAULT 0,
    last_lose_control_check TEXT,
    assigned_at TEXT,
    assigned_by TEXT,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS advancement_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    from_sequence INTEGER,
    to_sequence INTEGER,
    advanced_by TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );

  CREATE TABLE IF NOT EXISTS lose_control_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    sequence INTEGER,
    pathway TEXT,
    risk_percentage INTEGER,
    roll_result REAL,
    lost_control BOOLEAN,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );

  CREATE TABLE IF NOT EXISTS server_stats (
    guild_id TEXT PRIMARY KEY,
    total_beyonders INTEGER DEFAULT 0,
    total_advancements INTEGER DEFAULT 0,
    total_lose_control INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
  );
`);

console.log('✅ Database initialized');

// User functions
export function getUser(userId) {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
  return stmt.get(userId);
}

export function createUser(userId, username, pathway, assignedBy) {
  const stmt = db.prepare(`
    INSERT INTO users (user_id, username, pathway, sequence, assigned_by, assigned_at, updated_at)
    VALUES (?, ?, ?, 9, ?, datetime('now'), datetime('now'))
  `);
  return stmt.run(userId, username, pathway, assignedBy);
}

export function updateUserSequence(userId, newSequence, advancedBy) {
  const user = getUser(userId);
  
  if (!user) return null;
  
  // Update user
  const updateStmt = db.prepare(`
    UPDATE users 
    SET sequence = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `);
  updateStmt.run(newSequence, userId);
  
  // Log advancement
  const logStmt = db.prepare(`
    INSERT INTO advancement_history (user_id, from_sequence, to_sequence, advanced_by)
    VALUES (?, ?, ?, ?)
  `);
  logStmt.run(userId, user.sequence, newSequence, advancedBy);
  
  return getUser(userId);
}

export function setUserPathway(userId, username, pathway, assignedBy) {
  const existing = getUser(userId);
  
  if (existing) {
    const stmt = db.prepare(`
      UPDATE users 
      SET pathway = ?, assigned_by = ?, assigned_at = datetime('now'), updated_at = datetime('now')
      WHERE user_id = ?
    `);
    stmt.run(pathway, assignedBy, userId);
  } else {
    createUser(userId, username, pathway, assignedBy);
  }
  
  return getUser(userId);
}

export function deleteUser(userId) {
  const stmt = db.prepare('DELETE FROM users WHERE user_id = ?');
  return stmt.run(userId);
}

export function getAllUsers() {
  const stmt = db.prepare('SELECT * FROM users ORDER BY sequence ASC, pathway ASC');
  return stmt.all();
}

export function getUsersByPathway(pathway) {
  const stmt = db.prepare('SELECT * FROM users WHERE pathway = ? ORDER BY sequence ASC');
  return stmt.all(pathway);
}

export function getTopBeyonders(limit = 10) {
  const stmt = db.prepare('SELECT * FROM users WHERE pathway IS NOT NULL ORDER BY sequence ASC LIMIT ?');
  return stmt.all(limit);
}

// Lose control functions
export function logLoseControl(userId, sequence, pathway, risk, roll, lostControl) {
  const stmt = db.prepare(`
    INSERT INTO lose_control_logs (user_id, sequence, pathway, risk_percentage, roll_result, lost_control)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(userId, sequence, pathway, risk, roll, lostControl ? 1 : 0);
  
  if (lostControl) {
    const updateStmt = db.prepare(`
      UPDATE users 
      SET lose_control_count = lose_control_count + 1,
          last_lose_control_check = datetime('now')
      WHERE user_id = ?
    `);
    updateStmt.run(userId);
  }
}

export function getUserLoseControlHistory(userId, limit = 10) {
  const stmt = db.prepare(`
    SELECT * FROM lose_control_logs 
    WHERE user_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  return stmt.all(userId, limit);
}

export function getTotalLoseControlEvents() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM lose_control_logs WHERE lost_control = 1');
  return stmt.get().count;
}

// Stats functions
export function getPathwayStats() {
  const stmt = db.prepare(`
    SELECT pathway, COUNT(*) as count 
    FROM users 
    WHERE pathway IS NOT NULL 
    GROUP BY pathway 
    ORDER BY count DESC
  `);
  return stmt.all();
}

export function getSequenceDistribution() {
  const stmt = db.prepare(`
    SELECT sequence, COUNT(*) as count 
    FROM users 
    WHERE pathway IS NOT NULL 
    GROUP BY sequence 
    ORDER BY sequence ASC
  `);
  return stmt.all();
}

export function getAdvancementHistory(userId, limit = 10) {
  const stmt = db.prepare(`
    SELECT * FROM advancement_history 
    WHERE user_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  return stmt.all(userId, limit);
}

export default db;
    
