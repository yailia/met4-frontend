import { describe, it, expect, beforeEach } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { initDbOn } from './db.js';
import { createStore, type Store } from './store.js';

let db: Client;
let store: Store;

beforeEach(async () => {
  db = createClient({ url: ':memory:' });
  await initDbOn(db);
  store = createStore(db);
});

describe('store', () => {
  it('returns null for an unknown thread', async () => {
    expect(await store.getThread(1, 100)).toBeNull();
  });

  it('saves and reads a thread back', async () => {
    await store.saveThread(1, 100, {
      fromEmail: 'client@example.com',
      toEmail: 'hello@met4.ru',
      subject: 'Вопрос',
      messageId: '<abc@example.com>',
    });
    expect(await store.getThread(1, 100)).toEqual({
      fromEmail: 'client@example.com',
      toEmail: 'hello@met4.ru',
      subject: 'Вопрос',
      messageId: '<abc@example.com>',
    });
  });

  it('scopes by chat id', async () => {
    await store.saveThread(1, 100, {
      fromEmail: 'a@example.com',
      toEmail: 'hello@met4.ru',
      subject: 'x',
      messageId: null,
    });
    expect(await store.getThread(2, 100)).toBeNull();
  });
});
