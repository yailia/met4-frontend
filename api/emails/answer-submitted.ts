export function answerSubmittedEmail(params: {
  company: string;
  count: number;
  reportLink: string;
}): string {
  const { company, count, reportLink } = params;
  const word = count === 1 ? 'ответ' : count < 5 ? 'ответа' : 'ответов';
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>МЭТЧ — Новый ответ</title>
</head>
<body style="margin:0;padding:0;background-color:#1a1d24;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1d24;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.05em;">МЭТЧ</span>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#2d3038;border-radius:16px;border:1px solid rgba(255,255,255,0.1);padding:40px 40px 32px;">

              <!-- Eyebrow -->
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d4b8ff;">
                Новый ответ
              </p>

              <!-- Heading -->
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:600;line-height:1.3;color:#ffffff;">
                Сотрудник «${company}»<br>прошёл Q12
              </h1>

              <!-- Count badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:rgba(150,105,216,0.15);border:1px solid rgba(150,105,216,0.3);border-radius:8px;padding:10px 20px;">
                    <span style="font-size:15px;font-weight:600;color:#d4b8ff;">
                      Всего ${count} ${word}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:rgba(255,255,255,0.8);">
                Откройте актуальный отчёт чтобы увидеть текущую картину по команде.
              </p>

              <!-- Report CTA -->
              <a href="${reportLink}"
                 style="display:inline-block;background-color:#9669d8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;margin-bottom:28px;">
                Открыть отчёт →
              </a>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.08);"></td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);">
                Ссылка на отчёт:<br>
                <a href="${reportLink}" style="color:rgba(212,184,255,0.6);word-break:break-all;">${reportLink}</a>
              </p>

            </td>
          </tr>

          <!-- Calendly CTA -->
          <tr>
            <td style="padding:24px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#2d3038;border-radius:12px;border:1px solid rgba(255,255,255,0.08);padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 12px;font-size:14px;color:rgba(255,255,255,0.7);">
                      Хотите обсудить результаты с экспертом?
                    </p>
                    <a href="https://calendly.com/bolkunatz/30min"
                       style="display:inline-block;border:1px solid rgba(212,184,255,0.4);color:#d4b8ff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;">
                      Запланировать встречу →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
                © МЭТЧ · <a href="https://met4.ru" style="color:rgba(255,255,255,0.4);text-decoration:none;">met4.ru</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
