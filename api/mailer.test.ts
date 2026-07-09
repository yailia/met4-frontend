import { describe, it, expect, vi, afterEach } from 'vitest';
import { createMailer, maskEmail } from './mailer.js';
import { leadReceivedEmail } from './emails/lead-received.js';

afterEach(() => vi.restoreAllMocks());

describe('maskEmail', () => {
  it('keeps first char and domain', () => {
    expect(maskEmail('bolkunatz@gmail.com')).toBe('b***@gmail.com');
    expect(maskEmail('a@b.co')).toBe('a***@b.co');
  });
});

describe('mailer never throws', () => {
  it('sessionCreated survives network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mailer = createMailer({ resendKey: 're_test', leadInbox: 'x@y.co' });
    await expect(
      mailer.sessionCreated({ to: 'a@b.co', company: 'ACME', employeeLink: 'l1', reportLink: 'l2' })
    ).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
  });

  it('leadReceived posts to Resend with lead inbox as recipient', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'ok' }), { status: 200 }));
    const mailer = createMailer({ resendKey: 're_test', leadInbox: 'leads@met4.ru' });
    await mailer.leadReceived({ type: 'contact', fields: { name: 'Ivan', email: 'i@v.an' } });
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.to).toBe('leads@met4.ru');
    expect(body.subject).toContain('contact');
  });
});

describe('leadReceivedEmail', () => {
  it('escapes html in field values', () => {
    const html = leadReceivedEmail({ type: 'contact', fields: { name: '<script>x</script>' } });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
