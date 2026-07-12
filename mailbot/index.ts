import { serve } from '@hono/node-server';
import { loadConfig } from './config.js';
import { initDb } from './db.js';
import { createStore } from './store.js';
import { createMailer } from './mailer.js';
import { createBot } from './bot.js';
import { createSmtpServer } from './smtp.js';
import { createHttpApp } from './http.js';
import { deliverInbound, deliverLead, type TelegramSender } from './core.js';

const config = loadConfig();
const db = await initDb(config.dbUrl);
const store = createStore(db);
const mailer = createMailer(config);

const bot = createBot(config.botToken, {
  store,
  mailer,
  owners: config.ownerChatIds,
  fromEmail: config.fromEmail,
  fromName: config.fromName,
});

const telegram: TelegramSender = {
  sendMessage: (chatId, text, extra) =>
    bot.telegram
      .sendMessage(chatId, text, extra as Parameters<typeof bot.telegram.sendMessage>[2])
      .then((m) => ({ message_id: m.message_id })),
};

const smtp = createSmtpServer({
  mailDomain: config.mailDomain,
  onMail: (mail) =>
    deliverInbound(
      { telegram, store, ownerChatIds: config.ownerChatIds, textLimit: config.textLimit },
      mail
    ),
});
smtp.listen(config.smtpPort, '0.0.0.0', () => console.log(`SMTP listening on :${config.smtpPort}`));

const http = createHttpApp({
  internalToken: config.internalToken,
  onLead: (lead) => deliverLead({ telegram, ownerChatIds: config.ownerChatIds }, lead),
});
serve({ fetch: http.fetch, port: config.httpPort }, (i) => console.log(`HTTP listening on :${i.port}`));

bot.launch().catch((err) => console.error('[bot] launch failed:', err));
console.log('Mailbot started');

const shutdown = (sig: string) => {
  bot.stop(sig);
  smtp.close();
};
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
