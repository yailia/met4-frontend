import { answerSubmittedEmail } from './emails/answer-submitted.js';
import { leadReceivedEmail } from './emails/lead-received.js';
import { bookingConfirmedEmail } from './emails/booking-confirmed.js';

const SESSION_TEMPLATE_ID = '93475ea2-0e94-4f1e-b87c-435ba8cc8a53';
const FROM = 'МЭТЧ <noreply@met4.ru>';
const RESEND_URL = 'https://api.resend.com/emails';

export type BookingKind = 'webinar' | 'meeting';

export interface Mailer {
  sessionCreated(p: { to: string; company: string; employeeLink: string; reportLink: string }): Promise<void>;
  answerSubmitted(p: { to: string; company: string; count: number; reportLink: string }): Promise<void>;
  leadReceived(p: { type: string; fields: Record<string, string> }): Promise<void>;
  bookingConfirmed(p: { to: string; kind: BookingKind; slot: number; name: string; company?: string | null }): Promise<void>;
}

const BOOKING_MINUTES: Record<BookingKind, number> = { webinar: 60, meeting: 45 };

function icsStamp(epochMs: number): string {
  return new Date(epochMs).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildIcs(kind: BookingKind, slot: number): string {
  const summary = kind === 'webinar' ? 'Вебинар МЭТЧ: устойчивость команд' : 'Встреча с МЭТЧ';
  const description =
    kind === 'webinar'
      ? 'Разбор: что такое устойчивость команд, влияние на бизнес и как сохранять продуктивность в сложных ситуациях.'
      : 'Рабочая встреча с командой МЭТЧ.';
  const uid = `${slot}-${kind}@met4.ru`;
  const end = slot + BOOKING_MINUTES[kind] * 60 * 1000;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MET4//Booking//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(Date.now())}`,
    `DTSTART:${icsStamp(slot)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'ORGANIZER;CN=МЭТЧ:mailto:noreply@met4.ru',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
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

export function createMailer(cfg: { resendKey: string; leadInbox: string }): Mailer {
  async function send(label: string, to: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM, to, ...payload }),
      });
      const result = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        console.error(`[mailer] ${label} failed for ${maskEmail(to)}:`, result.message ?? res.status);
      } else {
        console.log(`[mailer] ${label} sent to ${maskEmail(to)} id=${result.id}`);
      }
    } catch (err) {
      console.error(`[mailer] ${label} error for ${maskEmail(to)}:`, err);
    }
  }

  return {
    sessionCreated: (p) =>
      send('sessionCreated', p.to, {
        subject: `МЭТЧ — ссылка для диагностики команды «${p.company}»`,
        template: {
          id: SESSION_TEMPLATE_ID,
          variables: { COMPANY: p.company, EMPLOYEE_LINK: p.employeeLink, REPORT_LINK: p.reportLink },
        },
      }),
    answerSubmitted: (p) =>
      send('answerSubmitted', p.to, {
        subject: `МЭТЧ — новый ответ Q12 (${p.company})`,
        html: answerSubmittedEmail({ company: p.company, count: p.count, reportLink: p.reportLink }),
      }),
    leadReceived: (p) =>
      send('leadReceived', cfg.leadInbox, {
        subject: `МЭТЧ — новая заявка (${p.type})`,
        html: leadReceivedEmail(p),
      }),
    bookingConfirmed: (p) => {
      const whenText = moscowWhenText(p.slot);
      const ics = buildIcs(p.kind, p.slot);
      return send('bookingConfirmed', p.to, {
        subject: p.kind === 'webinar' ? 'МЭТЧ — вы записаны на вебинар' : 'МЭТЧ — встреча забронирована',
        html: bookingConfirmedEmail({ kind: p.kind, whenText, name: p.name }),
        attachments: [{ filename: 'invite.ics', content: Buffer.from(ics, 'utf-8').toString('base64') }],
      });
    },
  };
}
