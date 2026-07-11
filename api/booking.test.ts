import { describe, it, expect } from 'vitest';
import { makeTestApp } from './test-helpers.js';

// Wednesday 17:00 MSK == 14:00 UTC
function nextWebinarSlot(): number {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 14, 0, 0, 0));
  while (d.getUTCDay() !== 3 || d.getTime() <= Date.now()) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime();
}

// Weekday 10:00 MSK == 07:00 UTC
function nextMeetingSlot(): number {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 0, 0, 0));
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6 || d.getTime() <= Date.now());
  return d.getTime();
}

describe('POST /api/book', () => {
  it('books a webinar slot, stores it and emails client + inbox', async () => {
    const { post, db, sent } = await makeTestApp();
    const slot = nextWebinarSlot();
    const res = await post('/api/book', { kind: 'webinar', name: 'Ivan', email: 'i@v.an', slot });
    expect(res.status).toBe(200);

    const rows = (await db.execute('SELECT * FROM bookings')).rows;
    expect(rows.length).toBe(1);
    expect(rows[0].kind).toBe('webinar');
    expect(Number(rows[0].slot_start)).toBe(slot);

    expect(sent.find((s) => s.kind === 'booking')).toBeDefined();
    expect(sent.find((s) => s.kind === 'lead')).toBeDefined();
  });

  it('books a meeting slot', async () => {
    const { post, db } = await makeTestApp();
    const res = await post('/api/book', { kind: 'meeting', name: 'Olga', email: 'o@l.ga', slot: nextMeetingSlot(), company: 'ACME' });
    expect(res.status).toBe(200);
    expect((await db.execute("SELECT * FROM bookings WHERE kind='meeting'")).rows.length).toBe(1);
  });

  it('400 on bad kind, bad email, missing name', async () => {
    const { post } = await makeTestApp();
    const slot = nextWebinarSlot();
    expect((await post('/api/book', { kind: 'evil', name: 'A', email: 'a@b.co', slot })).status).toBe(400);
    expect((await post('/api/book', { kind: 'webinar', name: 'A', email: 'nope', slot })).status).toBe(400);
    expect((await post('/api/book', { kind: 'webinar', name: '', email: 'a@b.co', slot })).status).toBe(400);
  });

  it('400 on past slot and on wrong day/time for the kind', async () => {
    const { post } = await makeTestApp();
    expect((await post('/api/book', { kind: 'webinar', name: 'A', email: 'a@b.co', slot: Date.now() - 1000 })).status).toBe(400);
    // meeting slot (10:00) is not a valid webinar slot (must be Wed 17:00)
    expect((await post('/api/book', { kind: 'webinar', name: 'A', email: 'a@b.co', slot: nextMeetingSlot() })).status).toBe(400);
  });

  it('honeypot: fake ok, nothing saved', async () => {
    const { post, db, sent } = await makeTestApp();
    const res = await post('/api/book', { kind: 'webinar', name: 'A', email: 'a@b.co', slot: nextWebinarSlot(), website: 'spam' });
    expect(res.status).toBe(200);
    expect((await db.execute('SELECT * FROM bookings')).rows.length).toBe(0);
    expect(sent.length).toBe(0);
  });
});
