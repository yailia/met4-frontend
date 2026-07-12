import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMailer, maskEmail } from './mailer.js';

describe('maskEmail', () => {
  it('masks the local part', () => {
    expect(maskEmail('client@example.com')).toBe('c***@example.com');
  });
  it('handles malformed input', () => {
    expect(maskEmail('nope')).toBe('***');
  });
});

describe('createMailer.sendReply', () => {
  const cfg = { rusenderKey: 'k', rusenderKeyId: 'id' };

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to Rusender with the chosen from address', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ uuid: '1' }) });
    vi.stubGlobal('fetch', fetchMock);

    const res = await createMailer(cfg).sendReply({
      from: 'hello@met4.ru',
      fromName: 'МЭТЧ',
      to: 'client@example.com',
      subject: 'Re: Вопрос',
      text: 'Ответ',
    });

    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/id');
    const body = JSON.parse(opts.body);
    expect(body.mail.from.email).toBe('hello@met4.ru');
    expect(body.mail.to.email).toBe('client@example.com');
    expect(body.mail.subject).toBe('Re: Вопрос');
    expect(body.mail.text).toBe('Ответ');
  });

  it('returns an error when Rusender rejects', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'bad from' }) });
    vi.stubGlobal('fetch', fetchMock);

    const res = await createMailer(cfg).sendReply({
      from: 'x@met4.ru',
      fromName: 'МЭТЧ',
      to: 'client@example.com',
      subject: 'Re: x',
      text: 'y',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toBe('bad from');
  });

  it('returns an error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const res = await createMailer(cfg).sendReply({
      from: 'x@met4.ru',
      fromName: 'МЭТЧ',
      to: 'client@example.com',
      subject: 'Re: x',
      text: 'y',
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('network down');
  });
});
