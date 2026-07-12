import type { InboundMail, Lead } from './types.js';

// Telegram HTML parse mode only needs &, <, > escaped.
export function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function truncate(s: string, limit: number): string {
  if (s.length <= limit) return s;
  return s.slice(0, limit) + '…';
}

export function replySubject(subject: string): string {
  const s = subject.trim();
  if (/^re:/i.test(s)) return s;
  return `Re: ${s || '(без темы)'}`;
}

export function formatInbound(mail: InboundMail, textLimit: number): string {
  const lines = [
    '📨 <b>Новое письмо</b>',
    '',
    `<b>От:</b> ${escapeHtml(mail.from)}`,
    `<b>Кому:</b> ${escapeHtml(mail.to)}`,
    `<b>Тема:</b> ${escapeHtml(mail.subject || '(без темы)')}`,
  ];
  if (mail.attachmentCount > 0) {
    lines.push(`<b>Вложений:</b> ${mail.attachmentCount}`);
  }
  lines.push('', escapeHtml(truncate(mail.text.trim() || '(пустое тело)', textLimit)));
  lines.push('', '<i>Ответьте reply на это сообщение, чтобы написать отправителю.</i>');
  return lines.join('\n');
}

const LEAD_LABELS: Record<string, string> = {
  name: 'Имя',
  email: 'Email',
  phone: 'Телефон',
  telegram: 'Telegram',
  company: 'Компания',
  position: 'Должность',
  slot: 'Слот',
  note: 'Комментарий',
};

export function formatLead(lead: Lead): string {
  const rows = Object.entries(lead.fields).map(
    ([k, v]) => `<b>${escapeHtml(LEAD_LABELS[k] ?? k)}:</b> ${escapeHtml(String(v))}`
  );
  return [`📝 <b>Новая заявка</b> — ${escapeHtml(lead.type)}`, '', ...rows].join('\n');
}
