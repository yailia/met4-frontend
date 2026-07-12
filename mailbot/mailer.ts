import { escapeHtml } from './format.js';

const RUSENDER_BASE = 'https://api.rusender.ru/api/v1/external-mails/send';

export interface ReplyParams {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

export interface Mailer {
  sendReply(p: ReplyParams): Promise<SendResult>;
}

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email[0]}***${email.slice(at)}`;
}

function textToHtml(text: string): string {
  return escapeHtml(text).replaceAll('\n', '<br>');
}

export function createMailer(cfg: { rusenderKey: string; rusenderKeyId: string }): Mailer {
  const url = `${RUSENDER_BASE}/${cfg.rusenderKeyId}`;

  return {
    async sendReply(p) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.rusenderKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mail: {
              to: { email: p.to },
              from: { email: p.from, name: p.fromName },
              subject: p.subject,
              html: textToHtml(p.text),
              text: p.text,
            },
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
          const error = body.message ?? body.error ?? `HTTP ${res.status}`;
          console.error(`[mailer] reply to ${maskEmail(p.to)} failed:`, error);
          return { ok: false, error };
        }
        console.log(`[mailer] reply sent from ${p.from} to ${maskEmail(p.to)}`);
        return { ok: true };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(`[mailer] reply to ${maskEmail(p.to)} error:`, error);
        return { ok: false, error };
      }
    },
  };
}
