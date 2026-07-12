import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { initDbOn } from './db.js';
import { createStore, type Store } from './store.js';
import { deliverInbound, deliverLead, handleReply, type TelegramSender } from './core.js';
import type { Mailer } from './mailer.js';
import type { InboundMail } from './types.js';

let db: Client;
let store: Store;

beforeEach(async () => {
  db = createClient({ url: ':memory:' });
  await initDbOn(db);
  store = createStore(db);
});

function fakeTelegram(startId = 1000): TelegramSender & { sent: Array<{ chatId: number; text: string }> } {
  let id = startId;
  const sent: Array<{ chatId: number; text: string }> = [];
  return {
    sent,
    async sendMessage(chatId, text) {
      sent.push({ chatId, text });
      return { message_id: ++id };
    },
  };
}

const okMailer: Mailer = { sendReply: vi.fn().mockResolvedValue({ ok: true }) };

const mail: InboundMail = {
  from: 'client@example.com',
  to: 'hello@met4.ru',
  subject: 'Вопрос',
  text: 'Тело',
  attachmentCount: 0,
  messageId: '<abc@x>',
};

describe('deliverInbound', () => {
  it('sends to every owner chat and stores each thread', async () => {
    const telegram = fakeTelegram();
    await deliverInbound({ telegram, store, ownerChatIds: [1, 2], textLimit: 3000 }, mail);

    expect(telegram.sent.map((s) => s.chatId)).toEqual([1, 2]);
    const t = await store.getThread(1, 1001);
    expect(t?.fromEmail).toBe('client@example.com');
    expect(t?.subject).toBe('Вопрос');
  });
});

describe('deliverLead', () => {
  it('sends a formatted lead to owners', async () => {
    const telegram = fakeTelegram();
    await deliverLead({ telegram, ownerChatIds: [7] }, { type: 'contact', fields: { name: 'Иван' } });
    expect(telegram.sent).toHaveLength(1);
    expect(telegram.sent[0].text).toContain('Новая заявка');
    expect(telegram.sent[0].text).toContain('Иван');
  });
});

describe('handleReply', () => {
  const deps = () => ({
    store,
    mailer: okMailer,
    owners: [42],
    fromEmail: 'hello@met4.ru',
    fromName: 'МЭТЧ',
  });

  beforeEach(() => vi.clearAllMocks());

  it('rejects a non-owner', async () => {
    const out = await handleReply(deps(), { senderId: 999, chatId: 1, text: 'hi', replyToMessageId: 5 });
    expect(out).toBe('вы не владелец');
    expect(okMailer.sendReply).not.toHaveBeenCalled();
  });

  it('asks for a reply target when none', async () => {
    const out = await handleReply(deps(), { senderId: 42, chatId: 1, text: 'hi', replyToMessageId: undefined });
    expect(out).toContain('reply');
  });

  it('reports when the thread is unknown', async () => {
    const out = await handleReply(deps(), { senderId: 42, chatId: 1, text: 'hi', replyToMessageId: 5 });
    expect(out).toContain('Не нашёл');
  });

  it('sends the reply email and confirms', async () => {
    await store.saveThread(1, 5, {
      fromEmail: 'client@example.com',
      toEmail: 'hello@met4.ru',
      subject: 'Вопрос',
      messageId: null,
    });
    const out = await handleReply(deps(), { senderId: 42, chatId: 1, text: 'Ответ', replyToMessageId: 5 });

    expect(okMailer.sendReply).toHaveBeenCalledWith({
      from: 'hello@met4.ru',
      fromName: 'МЭТЧ',
      to: 'client@example.com',
      subject: 'Re: Вопрос',
      text: 'Ответ',
    });
    expect(out).toContain('✅');
  });

  it('surfaces a send failure', async () => {
    await store.saveThread(1, 5, {
      fromEmail: 'client@example.com',
      toEmail: 'hello@met4.ru',
      subject: 'x',
      messageId: null,
    });
    const failMailer: Mailer = { sendReply: vi.fn().mockResolvedValue({ ok: false, error: 'boom' }) };
    const out = await handleReply(
      { store, mailer: failMailer, owners: [42], fromEmail: 'hello@met4.ru', fromName: 'МЭТЧ' },
      { senderId: 42, chatId: 1, text: 'y', replyToMessageId: 5 }
    );
    expect(out).toContain('boom');
  });
});
