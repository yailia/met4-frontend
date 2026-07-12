import { describe, it, expect, vi } from 'vitest';
import { createHttpApp } from './http.js';

const post = (app: ReturnType<typeof createHttpApp>, body: unknown, token?: string) =>
  app.request('/lead', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'x-internal-token': token } : {}),
    },
    body: JSON.stringify(body),
  });

describe('http /lead', () => {
  it('rejects without the internal token', async () => {
    const app = createHttpApp({ internalToken: 'secret', onLead: vi.fn() });
    const res = await post(app, { type: 'contact', fields: { name: 'x' } });
    expect(res.status).toBe(401);
  });

  it('delivers a valid lead', async () => {
    const onLead = vi.fn().mockResolvedValue(undefined);
    const app = createHttpApp({ internalToken: 'secret', onLead });
    const res = await post(app, { type: 'contact', fields: { name: 'Иван', email: 'i@e.com' } }, 'secret');
    expect(res.status).toBe(200);
    expect(onLead).toHaveBeenCalledWith({ type: 'contact', fields: { name: 'Иван', email: 'i@e.com' } });
  });

  it('coerces field values to strings and drops nulls', async () => {
    const onLead = vi.fn().mockResolvedValue(undefined);
    const app = createHttpApp({ internalToken: 'secret', onLead });
    await post(app, { type: 'booking:webinar', fields: { name: 'A', n: 5, skip: null } }, 'secret');
    expect(onLead).toHaveBeenCalledWith({ type: 'booking:webinar', fields: { name: 'A', n: '5' } });
  });

  it('400 when fields missing', async () => {
    const app = createHttpApp({ internalToken: 'secret', onLead: vi.fn() });
    const res = await post(app, { type: 'contact' }, 'secret');
    expect(res.status).toBe(400);
  });

  it('health responds ok', async () => {
    const app = createHttpApp({ internalToken: 's', onLead: vi.fn() });
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
