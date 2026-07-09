import { describe, it, expect } from 'vitest';
import { makeTestApp } from './test-helpers.js';

const HASH = '3f2c9a1e-7b4d-4e8a-9c1f-2d5b6a7c8d9e';
const SESSION = { hash: HASH, company: 'ACME', email: 'hr@acme.co' };

describe('GET /health', () => {
  it('returns ok', async () => {
    const { app } = await makeTestApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe('POST /sessions', () => {
  it('creates session and sends email', async () => {
    const { post, sent, db } = await makeTestApp();
    const res = await post('/sessions', SESSION);
    expect(res.status).toBe(200);
    expect((await db.execute('SELECT * FROM sessions')).rows.length).toBe(1);
    expect(sent[0].kind).toBe('session');
    const p = sent[0].payload as { employeeLink: string };
    expect(p.employeeLink).toBe(`https://met4.ru/assessment?h=${HASH}`);
  });

  it('400 on invalid json', async () => {
    const { app } = await makeTestApp();
    const res = await app.request('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-real-ip': '9.9.9.9' },
      body: '{broken',
    });
    expect(res.status).toBe(400);
  });

  it('400 on invalid email / hash / company', async () => {
    const { post } = await makeTestApp();
    expect((await post('/sessions', { ...SESSION, email: 'not-email' })).status).toBe(400);
    expect((await post('/sessions', { ...SESSION, hash: 'x' })).status).toBe(400);
    expect((await post('/sessions', { ...SESSION, company: '' })).status).toBe(400);
  });

  it('409 on duplicate hash', async () => {
    const { post } = await makeTestApp();
    expect((await post('/sessions', SESSION)).status).toBe(200);
    expect((await post('/sessions', SESSION)).status).toBe(409);
  });

  it('honeypot: pretends ok, saves nothing, sends nothing', async () => {
    const { post, sent, db } = await makeTestApp();
    const res = await post('/sessions', { ...SESSION, website: 'spam.biz' });
    expect(res.status).toBe(200);
    expect((await db.execute('SELECT * FROM sessions')).rows.length).toBe(0);
    expect(sent.length).toBe(0);
  });

  it('rate limits: 6th request from same ip within a minute -> 429', async () => {
    const { app } = await makeTestApp();
    const req = () =>
      app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': '7.7.7.7' },
        body: JSON.stringify(SESSION),
      });
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await req()).status);
    expect(statuses[5]).toBe(429);
  });
});

describe('POST /answers', () => {
  it('stores answers and notifies session owner', async () => {
    const { post, sent } = await makeTestApp();
    await post('/sessions', SESSION);
    const res = await post('/answers', { hash: HASH, answers: Array(12).fill(true), respondentId: HASH });
    expect(res.status).toBe(200);
    const note = sent.find((s) => s.kind === 'answer');
    expect(note).toBeDefined();
    expect((note!.payload as { count: number }).count).toBe(1);
  });

  it('same respondent twice -> one row (upsert), count stays 1', async () => {
    const { post, db } = await makeTestApp();
    await post('/sessions', SESSION);
    await post('/answers', { hash: HASH, answers: Array(12).fill(true), respondentId: HASH });
    await post('/answers', { hash: HASH, answers: Array(12).fill(false), respondentId: HASH });
    expect((await db.execute('SELECT * FROM answers')).rows.length).toBe(1);
  });

  it('400 on bad answers array', async () => {
    const { post } = await makeTestApp();
    await post('/sessions', SESSION);
    expect((await post('/answers', { hash: HASH, answers: Array(11).fill(true) })).status).toBe(400);
    expect((await post('/answers', { hash: HASH, answers: 'x' })).status).toBe(400);
  });

  it('404 when session does not exist', async () => {
    const { post } = await makeTestApp();
    const res = await post('/answers', { hash: HASH, answers: Array(12).fill(true) });
    expect(res.status).toBe(404);
  });
});

describe('GET /report/:hash', () => {
  it('computes percentages', async () => {
    const { app, post } = await makeTestApp();
    await post('/sessions', SESSION);
    await post('/answers', { hash: HASH, answers: Array(12).fill(true), respondentId: 'r1-aaaaaaaa' });
    await post('/answers', { hash: HASH, answers: Array(12).fill(false), respondentId: 'r2-bbbbbbbb' });
    const res = await app.request(`/report/${HASH}`);
    const body = await res.json();
    expect(body.count).toBe(2);
    expect(body.total).toBe(50);
    expect(body.byQuestion[0].pct).toBe(50);
  });

  it('400 on malformed hash', async () => {
    const { app } = await makeTestApp();
    expect((await app.request('/report/%20')).status).toBe(400);
  });

  it('empty report when no answers', async () => {
    const { app, post } = await makeTestApp();
    await post('/sessions', SESSION);
    const body = await (await app.request(`/report/${HASH}`)).json();
    expect(body).toEqual({ company: 'ACME', count: 0, total: null, byQuestion: null });
  });
});
