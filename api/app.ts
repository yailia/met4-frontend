import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import type { Client } from '@libsql/client';
import type { Config } from './config.js';
import type { Mailer } from './mailer.js';
import { rateLimit } from './rate-limit.js';
import {
  isValidEmail,
  isValidHash,
  isValidAnswers,
  cleanText,
  isValidBookingKind,
  isValidFutureSlot,
  isSlotAllowed,
} from './validate.js';

async function parseJson(c: Context): Promise<Record<string, unknown> | null> {
  try {
    const body = await c.req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isHoneypotTripped(body: Record<string, unknown>): boolean {
  return typeof body.website === 'string' && body.website.length > 0;
}

export function createApp(deps: { db: Client; mailer: Mailer; config: Config }): Hono {
  const { db, mailer, config } = deps;
  const app = new Hono();

  app.onError((err, c) => {
    console.error('[api] unhandled error:', err);
    return c.json({ error: 'Internal error' }, 500);
  });

  app.use('*', cors({ origin: config.frontendOrigin }));

  app.get('/health', async (c) => {
    await db.execute('SELECT 1');
    return c.json({ ok: true });
  });

  // ── POST /sessions ─────────────────────────────────────
  app.post('/sessions', rateLimit({ windowMs: 60_000, max: 5 }), async (c) => {
    const body = await parseJson(c);
    if (!body) return c.json({ error: 'Invalid JSON' }, 400);
    if (isHoneypotTripped(body)) return c.json({ ok: true });

    const company = cleanText(body.company, 200);
    if (!isValidHash(body.hash) || !isValidEmail(body.email) || !company) {
      return c.json({ error: 'Invalid fields' }, 400);
    }
    const { hash, email } = body;

    const existing = await db.execute({
      sql: 'SELECT hash FROM sessions WHERE hash = ?',
      args: [hash],
    });
    if (existing.rows.length > 0) return c.json({ error: 'Session already exists' }, 409);

    await db.execute({
      sql: 'INSERT INTO sessions (hash, company, email, created_at) VALUES (?, ?, ?, ?)',
      args: [hash, company, email, Date.now()],
    });

    await mailer.sessionCreated({
      to: email,
      company,
      employeeLink: `${config.frontendOrigin}/assessment?h=${hash}`,
      reportLink: `${config.frontendOrigin}/assessment?h=${hash}&report=1`,
    });

    return c.json({ ok: true });
  });

  // ── POST /answers ──────────────────────────────────────
  app.post('/answers', rateLimit({ windowMs: 60_000, max: 20 }), async (c) => {
    const body = await parseJson(c);
    if (!body) return c.json({ error: 'Invalid JSON' }, 400);

    if (!isValidHash(body.hash) || !isValidAnswers(body.answers)) {
      return c.json({ error: 'Invalid fields' }, 400);
    }
    const { hash, answers } = body;
    const respondentId = isValidHash(body.respondentId) ? body.respondentId : null;

    const sessRes = await db.execute({
      sql: 'SELECT company, email FROM sessions WHERE hash = ?',
      args: [hash],
    });
    const session = sessRes.rows[0];
    if (!session) return c.json({ error: 'Session not found' }, 404);

    await db.execute({
      sql: `INSERT INTO answers (hash, answers, respondent_id, created_at) VALUES (?, ?, ?, ?)
            ON CONFLICT(hash, respondent_id) DO UPDATE SET answers = excluded.answers, created_at = excluded.created_at`,
      args: [hash, JSON.stringify(answers), respondentId, Date.now()],
    });

    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM answers WHERE hash = ?',
      args: [hash],
    });
    const count = Number(countRes.rows[0]?.cnt ?? 1);

    await mailer.answerSubmitted({
      to: session.email as string,
      company: session.company as string,
      count,
      reportLink: `${config.frontendOrigin}/assessment?h=${hash}&report=1`,
    });

    return c.json({ ok: true });
  });

  // ── GET /report/:hash ──────────────────────────────────
  app.get('/report/:hash', async (c) => {
    const hash = c.req.param('hash');
    if (!isValidHash(hash)) return c.json({ error: 'Invalid hash' }, 400);

    const sessRes = await db.execute({
      sql: 'SELECT company FROM sessions WHERE hash = ?',
      args: [hash],
    });
    const company = (sessRes.rows[0]?.company as string) ?? 'Компания';

    const ansRes = await db.execute({
      sql: 'SELECT answers FROM answers WHERE hash = ?',
      args: [hash],
    });
    const rows = ansRes.rows.map((r) => JSON.parse(r.answers as string) as boolean[]);
    const count = rows.length;

    if (count === 0) {
      return c.json({ company, count: 0, total: null, byQuestion: null });
    }

    const byQuestion = Array.from({ length: 12 }, (_, i) => {
      const yesCount = rows.filter((r) => r[i] === true).length;
      return { pct: Math.round((yesCount / count) * 100) };
    });
    const totalYes = rows.reduce((sum, r) => sum + r.filter(Boolean).length, 0);
    const total = Math.round((totalYes / (count * 12)) * 100);

    return c.json({ company, count, total, byQuestion });
  });

  // ── POST /api/submit (contact & webinar lead forms) ────
  app.post('/api/submit', rateLimit({ windowMs: 60_000, max: 5 }), async (c) => {
    const body = await parseJson(c);
    if (!body) return c.json({ error: 'Invalid JSON' }, 400);
    if (isHoneypotTripped(body)) return c.json({ ok: true });

    const type = body.type === 'contact' || body.type === 'webinar' ? body.type : null;
    const name = cleanText(body.name, 200);
    if (!type || !name || !isValidEmail(body.email)) {
      return c.json({ error: 'Invalid fields' }, 400);
    }
    const email = body.email;

    const fields: Record<string, string> = { name, email };
    for (const key of ['phone', 'telegram', 'company', 'position'] as const) {
      const v = cleanText(body[key], 200);
      if (v) fields[key] = v;
    }

    await db.execute({
      sql: 'INSERT INTO leads (type, name, email, payload, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [type, name, email, JSON.stringify(fields), Date.now()],
    });

    await mailer.leadReceived({ type, fields });

    return c.json({ ok: true });
  });

  // ── POST /api/book (webinar & meeting bookings) ────────
  app.post('/api/book', rateLimit({ windowMs: 60_000, max: 5 }), async (c) => {
    const body = await parseJson(c);
    if (!body) return c.json({ error: 'Invalid JSON' }, 400);
    if (isHoneypotTripped(body)) return c.json({ ok: true });

    const kind = isValidBookingKind(body.kind) ? body.kind : null;
    const name = cleanText(body.name, 200);
    const slot = typeof body.slot === 'number' ? body.slot : NaN;
    if (!kind || !name || !isValidEmail(body.email) || !isValidFutureSlot(slot) || !isSlotAllowed(kind, slot)) {
      return c.json({ error: 'Invalid fields' }, 400);
    }
    const email = body.email;
    const company = cleanText(body.company, 200);
    const note = cleanText(body.note, 1000);

    await db.execute({
      sql: 'INSERT INTO bookings (kind, slot_start, name, email, company, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [kind, slot, name, email, company, note, Date.now()],
    });

    await mailer.bookingConfirmed({ to: email, kind, slot, name, company });
    await mailer.leadReceived({
      type: `booking:${kind}`,
      fields: {
        name,
        email,
        slot: new Date(slot).toISOString(),
        ...(company ? { company } : {}),
        ...(note ? { note } : {}),
      },
    });

    return c.json({ ok: true });
  });

  return app;
}
