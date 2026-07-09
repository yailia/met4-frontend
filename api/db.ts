import { createClient, type Client } from '@libsql/client';

export async function initDbOn(db: Client): Promise<Client> {
  await db.execute(`CREATE TABLE IF NOT EXISTS sessions (
    hash TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL,
    answers TEXT NOT NULL,
    respondent_id TEXT,
    created_at INTEGER NOT NULL
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
  try {
    await db.execute('ALTER TABLE answers ADD COLUMN respondent_id TEXT');
  } catch {
    // column already exists
  }
  await db.execute(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_answers_hash_respondent ON answers (hash, respondent_id)'
  );
  return db;
}

export async function initDb(url: string): Promise<Client> {
  return initDbOn(createClient({ url }));
}
