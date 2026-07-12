import { escapeHtml } from '../validate.js';

export function bookingConfirmedEmail(p: { kind: 'webinar' | 'meeting'; whenText: string; name: string }): string {
  const title = p.kind === 'webinar' ? 'Вы записаны на вебинар' : 'Встреча забронирована';
  const lead =
    p.kind === 'webinar'
      ? 'Разбираем, что такое устойчивость команд, как она влияет на бизнес и что делать, чтобы сотрудники не теряли продуктивность в сложных ситуациях.'
      : 'Мы свяжемся с вами к назначенному времени. Если планы изменятся — просто ответьте на это письмо.';
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>МЭТЧ — ${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background-color:#1a1d24;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1d24;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.05em;">МЭТЧ</span>
        </td></tr>
        <tr><td style="background-color:#2d3038;border-radius:16px;border:1px solid rgba(255,255,255,0.1);padding:40px;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d4b8ff;">
            ${escapeHtml(title)}
          </p>
          <p style="margin:0 0 8px;font-size:16px;color:#ffffff;">Здравствуйте, ${escapeHtml(p.name)}!</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.82);">${escapeHtml(lead)}</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
            <tr>
              <td style="padding:10px 16px 10px 0;color:#8a8f98;font-size:14px;">Когда</td>
              <td style="padding:10px 0;color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(p.whenText)} (МСК)</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
