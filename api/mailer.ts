import { answerSubmittedEmail } from './emails/answer-submitted.js';
import { leadReceivedEmail } from './emails/lead-received.js';
import { bookingConfirmedEmail } from './emails/booking-confirmed.js';
import { sessionCreatedEmail } from './emails/session-created.js';

const FROM = { email: 'noreply@met4.ru', name: 'МЭТЧ' };
// Replies to automated mail land in the hello@ mailbox (mailbot), not the dead noreply@.
const REPLY_TO = 'hello@met4.ru';
const RUSENDER_BASE = 'https://api.rusender.ru/api/v1/external-mails/send';

export type BookingKind = 'webinar' | 'meeting';

export interface Mailer {
  sessionCreated(p: { to: string; company: string; employeeLink: string; reportLink: string }): Promise<void>;
  answerSubmitted(p: { to: string; company: string; count: number; reportLink: string }): Promise<void>;
  leadReceived(p: { type: string; fields: Record<string, string> }): Promise<void>;
  bookingConfirmed(p: { to: string; kind: BookingKind; slot: number; name: string; company?: string | null }): Promise<void>;
}

function moscowWhenText(epochMs: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epochMs));
}

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email[0]}***${email.slice(at)}`;
}

export function createMailer(cfg: { rusenderKey: string; rusenderKeyId: string; leadInbox: string }): Mailer {
  const url = `${RUSENDER_BASE}/${cfg.rusenderKeyId}`;

  async function send(label: string, to: string, subject: string, html: string): Promise<void> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.rusenderKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mail: { to: { email: to }, from: FROM, subject, html, headers: { 'Reply-To': REPLY_TO } },
        }),
      });
      const result = (await res.json().catch(() => ({}))) as { uuid?: string; message?: string; error?: string };
      if (!res.ok) {
        console.error(`[mailer] ${label} failed for ${maskEmail(to)}:`, result.message ?? result.error ?? res.status);
      } else {
        console.log(`[mailer] ${label} sent to ${maskEmail(to)} id=${result.uuid ?? 'ok'}`);
      }
    } catch (err) {
      console.error(`[mailer] ${label} error for ${maskEmail(to)}:`, err);
    }
  }

  return {
    sessionCreated: (p) =>
      send(
        'sessionCreated',
        p.to,
        `МЭТЧ — ссылка для диагностики команды «${p.company}»`,
        sessionCreatedEmail({ company: p.company, employeeLink: p.employeeLink, reportLink: p.reportLink })
      ),
    answerSubmitted: (p) =>
      send(
        'answerSubmitted',
        p.to,
        `МЭТЧ — новый ответ Q12 (${p.company})`,
        answerSubmittedEmail({ company: p.company, count: p.count, reportLink: p.reportLink })
      ),
    leadReceived: (p) =>
      send('leadReceived', cfg.leadInbox, `МЭТЧ — новая заявка (${p.type})`, leadReceivedEmail(p)),
    bookingConfirmed: (p) =>
      send(
        'bookingConfirmed',
        p.to,
        p.kind === 'webinar' ? 'МЭТЧ — вы записаны на вебинар' : 'МЭТЧ — встреча забронирована',
        bookingConfirmedEmail({ kind: p.kind, whenText: moscowWhenText(p.slot), name: p.name })
      ),
  };
}
