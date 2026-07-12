import { describe, it, expect } from 'vitest';
import { loadConfig } from './config.js';

const FULL_ENV = {
  RUSENDER_KEY: 'rs_test',
  RUSENDER_KEY_ID: '42',
  FRONTEND_ORIGIN: 'https://met4.ru',
  DB_PATH: '/data/db.sqlite',
  LEAD_INBOX: 'leads@example.com',
  PORT: '4000',
};

describe('loadConfig', () => {
  it('loads all values from env', () => {
    const cfg = loadConfig(FULL_ENV as NodeJS.ProcessEnv);
    expect(cfg).toEqual({
      rusenderKey: 'rs_test',
      rusenderKeyId: '42',
      frontendOrigin: 'https://met4.ru',
      dbUrl: 'file:/data/db.sqlite',
      leadInbox: 'leads@example.com',
      port: 4000,
    });
  });

  it('applies defaults for optional vars', () => {
    const cfg = loadConfig({
      RUSENDER_KEY: 'rs_test',
      RUSENDER_KEY_ID: '42',
      FRONTEND_ORIGIN: 'https://met4.ru',
    } as NodeJS.ProcessEnv);
    expect(cfg.dbUrl).toBe('file:./db.sqlite');
    expect(cfg.leadInbox).toBe('bolkunatz@gmail.com');
    expect(cfg.port).toBe(3001);
  });

  it('throws when RUSENDER_KEY is missing', () => {
    expect(() =>
      loadConfig({ RUSENDER_KEY_ID: '42', FRONTEND_ORIGIN: 'https://met4.ru' } as NodeJS.ProcessEnv)
    ).toThrow(/RUSENDER_KEY/);
  });

  it('throws when RUSENDER_KEY_ID is missing', () => {
    expect(() =>
      loadConfig({ RUSENDER_KEY: 'rs_test', FRONTEND_ORIGIN: 'https://met4.ru' } as NodeJS.ProcessEnv)
    ).toThrow(/RUSENDER_KEY_ID/);
  });

  it('throws when FRONTEND_ORIGIN is missing', () => {
    expect(() =>
      loadConfig({ RUSENDER_KEY: 'rs_test', RUSENDER_KEY_ID: '42' } as NodeJS.ProcessEnv)
    ).toThrow(/FRONTEND_ORIGIN/);
  });
});
