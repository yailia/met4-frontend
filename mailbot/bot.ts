import { Telegraf } from 'telegraf';
import type { Agent } from 'node:http';
import { handleReply, type ReplyDeps } from './core.js';

export function createBot(botToken: string, deps: ReplyDeps, opts: { agent?: Agent } = {}): Telegraf {
  const bot = new Telegraf(botToken, opts.agent ? { telegram: { agent: opts.agent } } : undefined);

  bot.start((ctx) => ctx.reply('MET4 mailbot. Отвечайте на письма через reply на сообщение.'));
  bot.command('id', (ctx) => ctx.reply(`chat id: ${ctx.chat.id}`));

  bot.on('message', async (ctx) => {
    const msg = ctx.message as { text?: string; reply_to_message?: { message_id: number } };
    const text = typeof msg.text === 'string' ? msg.text : '';
    if (!text || text.startsWith('/')) return;

    const reply = await handleReply(deps, {
      senderId: ctx.from?.id,
      chatId: ctx.chat?.id ?? 0,
      text,
      replyToMessageId: msg.reply_to_message?.message_id,
    });
    await ctx.reply(reply);
  });

  bot.catch((err) => console.error('[bot] error:', err));
  return bot;
}
