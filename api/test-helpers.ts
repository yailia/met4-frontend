import { initDb } from './db.js';
import { createApp } from './app.js';
import type { Config } from './config.js';
import type { Mailer } from './mailer.js';

export interface SentMail {
  kind: 'session' | 'answer' | 'lead';
  payload: unknown;
}

export async function makeTestApp() {
  const db = await initDb(':memory:');
  const sent: SentMail[] = [];
  const mailer: Mailer = {
    sessionCreated: async (p) => void sent.push({ kind: 'session', payload: p }),
    answerSubmitted: async (p) => void sent.push({ kind: 'answer', payload: p }),
    leadReceived: async (p) => void sent.push({ kind: 'lead', payload: p }),
  };
  const config: Config = {
    resendKey: 're_test',
    frontendOrigin: 'https://met4.ru',
    dbUrl: ':memory:',
    leadInbox: 'leads@test.co',
    port: 0,
  };
  const app = createApp({ db, mailer, config });
  let ipCounter = 0;
  // unique IP per call so rate limiting does not interfere with functional tests
  const post = (path: string, body: unknown) =>
    app.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-real-ip': `10.0.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}` },
      body: JSON.stringify(body),
    });
  return { app, db, sent, post };
}
