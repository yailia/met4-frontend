import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { rateLimit } from './rate-limit.js';

function makeApp(max: number, windowMs = 60_000) {
  const app = new Hono();
  app.post('/x', rateLimit({ windowMs, max }), (c) => c.json({ ok: true }));
  return app;
}

describe('rateLimit', () => {
  it('allows up to max requests then returns 429', async () => {
    const app = makeApp(3);
    const headers = { 'x-real-ip': '1.2.3.4' };
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/x', { method: 'POST', headers });
      expect(res.status).toBe(200);
    }
    const blocked = await app.request('/x', { method: 'POST', headers });
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: 'Too many requests' });
  });

  it('tracks IPs independently', async () => {
    const app = makeApp(1);
    expect((await app.request('/x', { method: 'POST', headers: { 'x-real-ip': '1.1.1.1' } })).status).toBe(200);
    expect((await app.request('/x', { method: 'POST', headers: { 'x-real-ip': '2.2.2.2' } })).status).toBe(200);
    expect((await app.request('/x', { method: 'POST', headers: { 'x-real-ip': '1.1.1.1' } })).status).toBe(429);
  });

  it('resets after the window passes', async () => {
    const app = makeApp(1, 50);
    const headers = { 'x-real-ip': '3.3.3.3' };
    expect((await app.request('/x', { method: 'POST', headers })).status).toBe(200);
    expect((await app.request('/x', { method: 'POST', headers })).status).toBe(429);
    await new Promise((r) => setTimeout(r, 60));
    expect((await app.request('/x', { method: 'POST', headers })).status).toBe(200);
  });
});
