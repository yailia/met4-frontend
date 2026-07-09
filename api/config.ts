export interface Config {
  resendKey: string;
  frontendOrigin: string;
  dbUrl: string;
  leadInbox: string;
  port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const resendKey = env.RESEND_KEY;
  if (!resendKey) throw new Error('RESEND_KEY env var is required');
  const frontendOrigin = env.FRONTEND_ORIGIN;
  if (!frontendOrigin) throw new Error('FRONTEND_ORIGIN env var is required');
  return {
    resendKey,
    frontendOrigin,
    dbUrl: `file:${env.DB_PATH || './db.sqlite'}`,
    leadInbox: env.LEAD_INBOX || 'bolkunatz@gmail.com',
    port: Number(env.PORT) || 3001,
  };
}
