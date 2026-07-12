import type { Store } from './store.js';
import type { Mailer } from './mailer.js';
import { isOwner } from './owner.js';
import { formatInbound, formatLead, replySubject } from './format.js';
import type { InboundMail, Lead } from './types.js';

export interface TelegramSender {
  sendMessage(chatId: number, text: string, extra?: unknown): Promise<{ message_id: number }>;
}

export interface DeliverDeps {
  telegram: TelegramSender;
  store: Store;
  ownerChatIds: number[];
  textLimit: number;
}

export interface ReplyDeps {
  store: Store;
  mailer: Mailer;
  owners: number[];
  fromEmail: string;
  fromName: string;
}

export interface IncomingReply {
  senderId: number | undefined;
  chatId: number;
  text: string;
  replyToMessageId: number | undefined;
}

const HTML = { parse_mode: 'HTML' } as const;

// Deliver an inbound email to every owner chat and remember each thread so a
// Telegram reply can be routed back to the original sender.
export async function deliverInbound(deps: DeliverDeps, mail: InboundMail): Promise<void> {
  const text = formatInbound(mail, deps.textLimit);
  for (const chatId of deps.ownerChatIds) {
    const sent = await deps.telegram.sendMessage(chatId, text, HTML);
    await deps.store.saveThread(chatId, sent.message_id, {
      fromEmail: mail.from,
      toEmail: mail.to,
      subject: mail.subject,
      messageId: mail.messageId,
    });
  }
}

export async function deliverLead(
  deps: Pick<DeliverDeps, 'telegram' | 'ownerChatIds'>,
  lead: Lead
): Promise<void> {
  const text = formatLead(lead);
  for (const chatId of deps.ownerChatIds) {
    await deps.telegram.sendMessage(chatId, text, HTML);
  }
}

// Owner replies to a forwarded email → send the reply out via Rusender.
// Returns the message to show back to the owner in Telegram.
export async function handleReply(deps: ReplyDeps, msg: IncomingReply): Promise<string> {
  if (!isOwner(msg.senderId, deps.owners)) return 'вы не владелец';
  if (!msg.replyToMessageId) {
    return 'Чтобы ответить, сделайте reply на пересланное письмо.';
  }
  const thread = await deps.store.getThread(msg.chatId, msg.replyToMessageId);
  if (!thread) return 'Не нашёл исходное письмо для этого reply.';

  const res = await deps.mailer.sendReply({
    from: deps.fromEmail,
    fromName: deps.fromName,
    to: thread.fromEmail,
    subject: replySubject(thread.subject),
    text: msg.text,
  });
  if (!res.ok) return `❌ Не отправлено: ${res.error ?? 'ошибка'}`;
  return `✅ Отправлено с ${deps.fromEmail} → ${thread.fromEmail}`;
}
