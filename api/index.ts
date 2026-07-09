import { serve } from '@hono/node-server';
import { loadConfig } from './config.js';
import { initDb } from './db.js';
import { createMailer } from './mailer.js';
import { createApp } from './app.js';

const config = loadConfig();
const db = await initDb(config.dbUrl);
const mailer = createMailer(config);
const app = createApp({ db, mailer, config });

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`API running on http://localhost:${info.port}`);
});
