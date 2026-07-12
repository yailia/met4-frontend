import type { Client } from '@libsql/client';
import type { ThreadRecord } from './types.js';

export interface Store {
  saveThread(chatId: number, tgMessageId: number, rec: ThreadRecord): Promise<void>;
  getThread(chatId: number, tgMessageId: number): Promise<ThreadRecord | null>;
}

export function createStore(db: Client): Store {
  return {
    async saveThread(chatId, tgMessageId, rec) {
      await db.execute({
        sql: `INSERT INTO threads (chat_id, tg_message_id, from_email, to_email, subject, message_id, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(chat_id, tg_message_id) DO UPDATE SET
                from_email = excluded.from_email,
                to_email = excluded.to_email,
                subject = excluded.subject,
                message_id = excluded.message_id`,
        args: [chatId, tgMessageId, rec.fromEmail, rec.toEmail, rec.subject, rec.messageId, Date.now()],
      });
    },

    async getThread(chatId, tgMessageId) {
      const res = await db.execute({
        sql: 'SELECT from_email, to_email, subject, message_id FROM threads WHERE chat_id = ? AND tg_message_id = ?',
        args: [chatId, tgMessageId],
      });
      const row = res.rows[0];
      if (!row) return null;
      return {
        fromEmail: row.from_email as string,
        toEmail: row.to_email as string,
        subject: row.subject as string,
        messageId: (row.message_id as string | null) ?? null,
      };
    },
  };
}
