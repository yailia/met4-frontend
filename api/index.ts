import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@libsql/client';
import { Resend } from 'resend';

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_TOKEN!,
});

const resend = new Resend(process.env.RESEND_KEY!);
const FROM = 'МЭТЧ <noreply@met4.ru>';
const ORIGIN = process.env.FRONTEND_ORIGIN || '*';

const app = new Hono();

app.use('*', cors({ origin: ORIGIN }));

// ── POST /sessions ─────────────────────────────────────
app.post('/sessions', async (c) => {
  const { hash, company, email } = await c.req.json<{
    hash: string;
    company: string;
    email: string;
  }>();

  if (!hash || !company || !email) {
    return c.json({ error: 'Missing fields' }, 400);
  }

  await db.execute({
    sql: 'INSERT INTO sessions (hash, company, email, created_at) VALUES (?, ?, ?, ?)',
    args: [hash, company, email, Date.now()],
  });

  const base = process.env.FRONTEND_ORIGIN || 'https://yailia.github.io/met4-frontend';
  const employeeLink = `${base}/assessment?h=${hash}`;
  const reportLink   = `${base}/assessment?h=${hash}&report=1`;

  console.log('[sessions] sending email to:', email, 'from:', FROM);
  const emailResult = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `МЭТЧ — ссылка для диагностики команды «${company}»`,
    html: `
      <p>Здравствуйте!</p>
      <p>Отправьте сотрудникам эту ссылку для прохождения Q12:</p>
      <p><a href="${employeeLink}">${employeeLink}</a></p>
      <p>Когда все пройдут, откройте отчёт здесь:<br>
      <a href="${reportLink}">${reportLink}</a></p>
      <p>Если хотите обсудить детали — <a href="https://calendly.com/bolkunatz/30min">запланируйте встречу</a>.</p>
      <p>— Команда МЭТЧ</p>
    `,
  });
  console.log('[sessions] resend result:', JSON.stringify(emailResult));

  return c.json({ ok: true });
});

// ── POST /answers ──────────────────────────────────────
app.post('/answers', async (c) => {
  const { hash, answers } = await c.req.json<{
    hash: string;
    answers: boolean[];
  }>();

  if (!hash || !Array.isArray(answers)) {
    return c.json({ error: 'Missing fields' }, 400);
  }

  await db.execute({
    sql: 'INSERT INTO answers (hash, answers, created_at) VALUES (?, ?, ?)',
    args: [hash, JSON.stringify(answers), Date.now()],
  });

  return c.json({ ok: true });
});

// ── GET /report/:hash ──────────────────────────────────
app.get('/report/:hash', async (c) => {
  const hash = c.req.param('hash');

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

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3001 }, (info) => {
  console.log(`API running on http://localhost:${info.port}`);
});
