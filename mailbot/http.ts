import { Hono } from 'hono';
import type { Lead } from './types.js';

export interface HttpDeps {
  internalToken: string;
  onLead: (lead: Lead) => Promise<void>;
}

export function createHttpApp(deps: HttpDeps): Hono {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true }));

  app.post('/lead', async (c) => {
    if (c.req.header('x-internal-token') !== deps.internalToken) {
      return c.json({ error: 'unauthorized' }, 401);
    }
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid json' }, 400);
    }
    const rec = body as { type?: unknown; fields?: unknown };
    const type = typeof rec.type === 'string' ? rec.type : null;
    const fields = rec.fields;
    if (!type || typeof fields !== 'object' || fields === null || Array.isArray(fields)) {
      return c.json({ error: 'invalid fields' }, 400);
    }
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields as Record<string, unknown>)) {
      if (v != null) clean[k] = String(v);
    }
    await deps.onLead({ type, fields: clean });
    return c.json({ ok: true });
  });

  return app;
}
