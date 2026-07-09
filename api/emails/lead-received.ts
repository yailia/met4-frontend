import { escapeHtml } from '../validate.js';

const LABELS: Record<string, string> = {
  name: 'Имя',
  email: 'Email',
  phone: 'Телефон',
  telegram: 'Telegram',
  company: 'Компания',
  position: 'Должность',
};

export function leadReceivedEmail(p: { type: string; fields: Record<string, string> }): string {
  const rows = Object.entries(p.fields)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 16px 8px 0;color:#8a8f98;font-size:14px;">${escapeHtml(LABELS[k] ?? k)}</td>` +
        `<td style="padding:8px 0;color:#ffffff;font-size:14px;">${escapeHtml(v)}</td></tr>`
    )
    .join('');
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>МЭТЧ — Новая заявка</title></head>
<body style="margin:0;padding:0;background-color:#1a1d24;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1d24;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.05em;">МЭТЧ</span>
        </td></tr>
        <tr><td style="background-color:#2d3038;border-radius:16px;border:1px solid rgba(255,255,255,0.1);padding:40px;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d4b8ff;">
            Новая заявка — ${escapeHtml(p.type)}
          </p>
          <table cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
