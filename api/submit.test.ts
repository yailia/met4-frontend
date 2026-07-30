import { describe, it, expect } from 'vitest';
import { makeTestApp } from './test-helpers.js';

const CONTACT = { type: 'contact', name: 'Ivan', email: 'i@v.an', phone: '+7 999 123-45-67', telegram: '@ivan' };
const WEBINAR = { type: 'webinar', name: 'Olga', email: 'o@l.ga', company: 'ACME', position: 'HRD' };

describe('POST /api/submit', () => {
  it('saves contact lead and emails the inbox', async () => {
    const { post, db, sent } = await makeTestApp();
    const res = await post('/api/submit', CONTACT);
    expect(res.status).toBe(200);
    const rows = (await db.execute('SELECT * FROM leads')).rows;
    expect(rows.length).toBe(1);
    expect(rows[0].type).toBe('contact');
    expect(rows[0].email).toBe('i@v.an');
    const mail = sent.find((s) => s.kind === 'lead');
    expect(mail).toBeDefined();
    expect((mail!.payload as { fields: Record<string, string> }).fields.phone).toBe('+7 999 123-45-67');
  });

  it('saves webinar lead', async () => {
    const { post, db } = await makeTestApp();
    expect((await post('/api/submit', WEBINAR)).status).toBe(200);
    expect((await db.execute("SELECT * FROM leads WHERE type='webinar'")).rows.length).toBe(1);
  });

  it('saves guide lead with the guide slug', async () => {
    const { post, db } = await makeTestApp();
    const res = await post('/api/submit', {
      type: 'guide',
      name: 'Pavel',
      email: 'p@a.vel',
      guide: 'one-to-one-50-questions',
    });
    expect(res.status).toBe(200);
    const rows = (await db.execute("SELECT * FROM leads WHERE type='guide'")).rows;
    expect(rows.length).toBe(1);
    expect(JSON.parse(String(rows[0].payload)).guide).toBe('one-to-one-50-questions');
  });

  it('400 on unknown type, bad email, missing name', async () => {
    const { post } = await makeTestApp();
    expect((await post('/api/submit', { ...CONTACT, type: 'evil' })).status).toBe(400);
    expect((await post('/api/submit', { ...CONTACT, email: 'nope' })).status).toBe(400);
    expect((await post('/api/submit', { ...CONTACT, name: '' })).status).toBe(400);
  });

  it('honeypot: fake ok, nothing saved or sent', async () => {
    const { post, db, sent } = await makeTestApp();
    const res = await post('/api/submit', { ...CONTACT, website: 'http://spam' });
    expect(res.status).toBe(200);
    expect((await db.execute('SELECT * FROM leads')).rows.length).toBe(0);
    expect(sent.length).toBe(0);
  });
});
