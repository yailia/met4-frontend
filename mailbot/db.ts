import { createClient, type Client } from '@libsql/client';

export async function initDbOn(db: Client): Promise<Client> {
  await db.execute(`CREATE TABLE IF NOT EXISTS threads (
    chat_id INTEGER NOT NULL,
    tg_message_id INTEGER NOT NULL,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message_id TEXT,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (chat_id, tg_message_id)
  )`);
  return db;
}

export async function initDb(url: string): Promise<Client> {
  return initDbOn(createClient({ url }));
}
