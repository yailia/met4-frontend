export interface Notifier {
  lead(p: { type: string; fields: Record<string, string> }): Promise<void>;
}

// Pushes a lead to the mailbot's internal /lead endpoint so it shows up in
// Telegram. Best-effort: never throws, so a mailbot outage can't fail a form.
export function createNotifier(cfg: { mailbotUrl?: string; mailbotToken?: string }): Notifier {
  return {
    async lead(p) {
      if (!cfg.mailbotUrl || !cfg.mailbotToken) return;
      try {
        const res = await fetch(`${cfg.mailbotUrl.replace(/\/$/, '')}/lead`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': cfg.mailbotToken,
          },
          body: JSON.stringify(p),
        });
        if (!res.ok) console.error('[notifier] lead push rejected:', res.status);
      } catch (err) {
        console.error('[notifier] lead push failed:', err instanceof Error ? err.message : err);
      }
    },
  };
}
