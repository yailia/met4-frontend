import { describe, it, expect, vi, afterEach } from 'vitest';
import { createMailer, maskEmail } from './mailer.js';
import { leadReceivedEmail } from './emails/lead-received.js';

afterEach(() => vi.restoreAllMocks());

const CFG = { rusenderKey: 'rs_test', rusenderKeyId: '42', leadInbox: 'leads@met4.ru' };

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
    const mailer = createMailer(CFG);
    await expect(
      mailer.sessionCreated({ to: 'a@b.co', company: 'ACME', employeeLink: 'l1', reportLink: 'l2' })
    ).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
  });

  it('leadReceived posts to Rusender with lead inbox as recipient', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ uuid: 'ok' }), { status: 200 }));
    const mailer = createMailer(CFG);
    await mailer.leadReceived({ type: 'contact', fields: { name: 'Ivan', email: 'i@v.an' } });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('api.rusender.ru');
    expect(String(url)).toContain('/42');
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer rs_test');
    const body = JSON.parse(init!.body as string);
    expect(body.mail.to.email).toBe('leads@met4.ru');
    expect(body.mail.from.email).toBe('noreply@met4.ru');
    expect(body.mail.headers['Reply-To']).toBe('hello@met4.ru');
    expect(body.mail.subject).toContain('contact');
  });
});

describe('leadReceivedEmail', () => {
  it('escapes html in field values', () => {
    const html = leadReceivedEmail({ type: 'contact', fields: { name: '<script>x</script>' } });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
