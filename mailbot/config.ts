export interface Config {
  botToken: string;
  ownerChatIds: number[];
  rusenderKey: string;
  rusenderKeyId: string;
  mailDomain: string;
  fromEmail: string;
  fromName: string;
  fromAddresses: string[];
  internalToken: string;
  smtpPort: number;
  httpPort: number;
  dbUrl: string;
  textLimit: number;
  telegramProxy?: string;
}

function parseChatIds(raw: string): number[] {
  const ids = raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n !== 0);
  if (ids.length === 0) throw new Error('OWNER_CHAT_IDS must contain at least one numeric id');
  return ids;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const botToken = env.BOT_TOKEN;
  if (!botToken) throw new Error('BOT_TOKEN env var is required');
  const rusenderKey = env.RUSENDER_KEY;
  if (!rusenderKey) throw new Error('RUSENDER_KEY env var is required');
  const rusenderKeyId = env.RUSENDER_KEY_ID;
  if (!rusenderKeyId) throw new Error('RUSENDER_KEY_ID env var is required');
  const internalToken = env.INTERNAL_TOKEN;
  if (!internalToken) throw new Error('INTERNAL_TOKEN env var is required');

  const mailDomain = env.MAIL_DOMAIN || 'met4.ru';
  const fromEmail = env.FROM_EMAIL || `hello@${mailDomain}`;
  const fromAddresses = (env.FROM_ADDRESSES || fromEmail)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    botToken,
    ownerChatIds: parseChatIds(env.OWNER_CHAT_IDS || '152579925'),
    rusenderKey,
    rusenderKeyId,
    mailDomain,
    fromEmail,
    fromName: env.FROM_NAME || 'МЭТЧ',
    fromAddresses,
    internalToken,
    smtpPort: Number(env.SMTP_PORT) || 2525,
    httpPort: Number(env.HTTP_PORT) || 3002,
    dbUrl: `file:${env.DB_PATH || './mailbot.sqlite'}`,
    textLimit: Number(env.TEXT_LIMIT) || 3000,
    telegramProxy: env.TELEGRAM_PROXY || undefined,
  };
}
