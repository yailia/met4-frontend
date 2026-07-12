import { describe, it, expect } from 'vitest';
import net from 'node:net';
import { buildInbound, createSmtpServer, type SmtpServerHandle } from './smtp.js';
import type { InboundMail } from './types.js';

describe('buildInbound', () => {
  it('prefers envelope recipients for To', () => {
    const mail = buildInbound(
      { from: { text: 'A <a@x.com>' }, subject: 'Hi', text: 'body', messageId: '<m@x>' },
      { mailFrom: { address: 'a@x.com' }, rcptTo: [{ address: 'hello@met4.ru' }] }
    );
    expect(mail.to).toBe('hello@met4.ru');
    expect(mail.from).toBe('A <a@x.com>');
    expect(mail.subject).toBe('Hi');
    expect(mail.text).toBe('body');
    expect(mail.messageId).toBe('<m@x>');
  });

  it('falls back to stripped html when no text', () => {
    const mail = buildInbound(
      { html: '<p>Hello <b>world</b></p>' },
      { rcptTo: [{ address: 'x@met4.ru' }] }
    );
    expect(mail.text).toBe('Hello world');
  });

  it('counts attachments', () => {
    const mail = buildInbound({ attachments: [{}, {}] }, { rcptTo: [{ address: 'x@met4.ru' }] });
    expect(mail.attachmentCount).toBe(2);
  });
});

interface SmtpClient {
  read(): Promise<string>;
  write(s: string): void;
  end(): void;
}

function smtpClient(port: number): SmtpClient {
  const sock = net.createConnection(port, '127.0.0.1');
  const queue: string[] = [];
  let resolver: ((s: string) => void) | null = null;
  sock.on('data', (b) => {
    const s = b.toString();
    if (resolver) {
      const r = resolver;
      resolver = null;
      r(s);
    } else queue.push(s);
  });
  return {
    read: () =>
      new Promise<string>((res) => {
        const q = queue.shift();
        if (q) res(q);
        else resolver = res;
      }),
    write: (s) => sock.write(s + '\r\n'),
    end: () => sock.end(),
  };
}

describe('createSmtpServer (integration)', () => {
  it('accepts a @met4.ru message and delivers it', async () => {
    let delivered: InboundMail | null = null;
    let resolveMail!: () => void;
    const gotMail = new Promise<void>((r) => (resolveMail = r));

    const server = createSmtpServer({
      mailDomain: 'met4.ru',
      onMail: async (m) => {
        delivered = m;
        resolveMail();
      },
    });
    const port = await new Promise<number>((res) => {
      server.listen(0, '127.0.0.1', () => {
        res((server as unknown as { server: net.Server }).server.address() ? ((server as unknown as { server: net.Server }).server.address() as net.AddressInfo).port : 0);
      });
    });

    try {
      const c = smtpClient(port);
      expect(await c.read()).toMatch(/^220/);
      c.write('HELO test');
      expect(await c.read()).toMatch(/^250/);
      c.write('MAIL FROM:<sender@outside.com>');
      expect(await c.read()).toMatch(/^250/);
      c.write('RCPT TO:<hello@met4.ru>');
      expect(await c.read()).toMatch(/^250/);
      c.write('DATA');
      expect(await c.read()).toMatch(/^354/);
      c.write('Subject: Test subject\r\nMessage-ID: <m1@outside.com>\r\n\r\nHello there\r\n.');
      expect(await c.read()).toMatch(/^250/);
      c.write('QUIT');
      c.end();

      await gotMail;
      expect(delivered).not.toBeNull();
      expect(delivered!.to).toBe('hello@met4.ru');
      expect(delivered!.subject).toBe('Test subject');
      expect(delivered!.text).toContain('Hello there');
    } finally {
      await new Promise<void>((res) => server.close(() => res()));
    }
  });

  it('rejects a recipient outside the domain', async () => {
    const server = createSmtpServer({ mailDomain: 'met4.ru', onMail: async () => {} });
    const port = await new Promise<number>((res) => {
      server.listen(0, '127.0.0.1', () =>
        res(((server as unknown as { server: net.Server }).server.address() as net.AddressInfo).port)
      );
    });
    try {
      const c = smtpClient(port);
      expect(await c.read()).toMatch(/^220/);
      c.write('HELO test');
      expect(await c.read()).toMatch(/^250/);
      c.write('MAIL FROM:<sender@outside.com>');
      expect(await c.read()).toMatch(/^250/);
      c.write('RCPT TO:<stranger@other.com>');
      expect(await c.read()).toMatch(/^550/);
      c.end();
    } finally {
      await new Promise<void>((res) => server.close(() => res()));
    }
  });
});
