import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import type { InboundMail } from './types.js';

export interface SmtpServerHandle {
  listen(port: number, host?: string, cb?: () => void): void;
  close(cb?: () => void): void;
}

// Loose shapes for the parts of mailparser / smtp-server we touch.
interface ParsedLike {
  from?: { text?: string };
  to?: { text?: string };
  subject?: string;
  text?: string;
  html?: string | false;
  messageId?: string;
  attachments?: unknown[];
}
interface EnvelopeLike {
  mailFrom?: { address?: string } | false;
  rcptTo?: Array<{ address: string }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildInbound(parsed: ParsedLike, envelope: EnvelopeLike): InboundMail {
  const rcpts = (envelope.rcptTo ?? []).map((r) => r.address);
  const to = rcpts.join(', ') || parsed.to?.text || '';
  const from =
    parsed.from?.text || (envelope.mailFrom ? envelope.mailFrom.address : undefined) || 'unknown';
  const text = (parsed.text ?? '').trim() || (parsed.html ? stripHtml(parsed.html) : '');
  return {
    from,
    to,
    subject: parsed.subject ?? '',
    text,
    attachmentCount: parsed.attachments?.length ?? 0,
    messageId: parsed.messageId ?? null,
  };
}

export interface SmtpDeps {
  mailDomain: string;
  onMail: (mail: InboundMail) => Promise<void>;
  maxBytes?: number;
}

export function createSmtpServer(deps: SmtpDeps): SmtpServerHandle {
  const suffix = `@${deps.mailDomain.toLowerCase()}`;
  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ['AUTH', 'STARTTLS'],
    size: deps.maxBytes ?? 15 * 1024 * 1024,
    onRcptTo(address: { address: string }, _session: unknown, cb: (err?: Error) => void) {
      if (address.address.toLowerCase().endsWith(suffix)) return cb();
      return cb(new Error('550 Relaying denied'));
    },
    onData(
      stream: NodeJS.ReadableStream,
      session: { envelope: EnvelopeLike },
      cb: (err?: Error) => void
    ) {
      simpleParser(stream)
        .then(async (parsed: ParsedLike) => {
          await deps.onMail(buildInbound(parsed, session.envelope));
          cb();
        })
        .catch((err: Error) => {
          console.error('[smtp] parse/deliver error:', err.message);
          cb(err);
        });
    },
  });
  server.on('error', (err: Error) => console.error('[smtp] server error:', err.message));
  return server as SmtpServerHandle;
}
