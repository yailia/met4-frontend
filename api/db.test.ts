import { describe, it, expect } from 'vitest';
import { initDb } from './db.js';

describe('initDb', () => {
  it('creates sessions, answers, leads tables', async () => {
    const db = await initDb(':memory:');
    const res = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const names = res.rows.map((r) => r.name);
    expect(names).toContain('sessions');
    expect(names).toContain('answers');
    expect(names).toContain('leads');
  });

  it('answers has unique (hash, respondent_id) — upsert works', async () => {
    const db = await initDb(':memory:');
    const sql = `INSERT INTO answers (hash, answers, respondent_id, created_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(hash, respondent_id) DO UPDATE SET answers = excluded.answers`;
    await db.execute({ sql, args: ['h1', '[true]', 'r1', 1] });
    await db.execute({ sql, args: ['h1', '[false]', 'r1', 2] });
    const res = await db.execute('SELECT answers FROM answers');
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].answers).toBe('[false]');
  });

  it('migrates a legacy answers table (no respondent_id column)', async () => {
    const db = await initDb(':memory:');
    await db.execute('DROP TABLE answers');
    await db.execute(`CREATE TABLE answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL, answers TEXT NOT NULL, created_at INTEGER NOT NULL)`);
    const db2 = await initDb(':memory:'); // fresh check only proves idempotency
    await expect(
      db.execute('SELECT respondent_id FROM answers')
    ).rejects.toThrow();
    const { initDbOn } = await import('./db.js');
    await initDbOn(db);
    const res = await db.execute('SELECT respondent_id FROM answers');
    expect(res.rows.length).toBe(0);
    expect(db2).toBeDefined();
  });
});
