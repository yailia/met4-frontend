import { answerSubmittedEmail } from './emails/answer-submitted.js';
import { leadReceivedEmail } from './emails/lead-received.js';

const SESSION_TEMPLATE_ID = '93475ea2-0e94-4f1e-b87c-435ba8cc8a53';
const FROM = 'МЭТЧ <noreply@met4.ru>';
const RESEND_URL = 'https://api.resend.com/emails';

export interface Mailer {
  sessionCreated(p: { to: string; company: string; employeeLink: string; reportLink: string }): Promise<void>;
  answerSubmitted(p: { to: string; company: string; count: number; reportLink: string }): Promise<void>;
  leadReceived(p: { type: string; fields: Record<string, string> }): Promise<void>;
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
  };
}
