export interface Config {
  rusenderKey: string;
  rusenderKeyId: string;
  frontendOrigin: string;
  dbUrl: string;
  leadInbox: string;
  port: number;
  mailbotUrl?: string;
  mailbotToken?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const rusenderKey = env.RUSENDER_KEY;
  if (!rusenderKey) throw new Error('RUSENDER_KEY env var is required');
  const rusenderKeyId = env.RUSENDER_KEY_ID;
  if (!rusenderKeyId) throw new Error('RUSENDER_KEY_ID env var is required');
  const frontendOrigin = env.FRONTEND_ORIGIN;
  if (!frontendOrigin) throw new Error('FRONTEND_ORIGIN env var is required');
  return {
    rusenderKey,
    rusenderKeyId,
    frontendOrigin,
    dbUrl: `file:${env.DB_PATH || './db.sqlite'}`,
    leadInbox: env.LEAD_INBOX || 'bolkunatz@gmail.com',
    port: Number(env.PORT) || 3001,
    mailbotUrl: env.MAILBOT_URL,
    mailbotToken: env.MAILBOT_TOKEN,
  };
}
