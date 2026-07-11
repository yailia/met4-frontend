const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HASH_RE = /^[a-zA-Z0-9-]{8,64}$/;

export function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}

export function isValidHash(v: unknown): v is string {
  return typeof v === 'string' && HASH_RE.test(v);
}

export function isValidAnswers(v: unknown): v is boolean[] {
  return Array.isArray(v) && v.length === 12 && v.every((x) => typeof x === 'boolean');
}

export function cleanText(v: unknown, maxLen: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t.length === 0 || t.length > maxLen) return null;
  return t;
}

export function isValidBookingKind(v: unknown): v is 'webinar' | 'meeting' {
  return v === 'webinar' || v === 'meeting';
}

// Moscow time is a fixed UTC+3 offset (no DST since 2014).
export function moscowParts(epochMs: number): { dow: number; hour: number; minute: number } {
  const d = new Date(epochMs + 3 * 60 * 60 * 1000);
  return { dow: d.getUTCDay(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

// Slot must be a finite timestamp in the future, within the next 180 days.
export function isValidFutureSlot(v: unknown): v is number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return false;
  const now = Date.now();
  return v > now && v < now + 1000 * 60 * 60 * 24 * 180;
}

// Booking rules: webinar = Wednesday 17:00 MSK; meeting = Mon–Fri, 09:00–18:30 MSK, on the hour or half-hour.
export function isSlotAllowed(kind: 'webinar' | 'meeting', epochMs: number): boolean {
  const { dow, hour, minute } = moscowParts(epochMs);
  if (kind === 'webinar') return dow === 3 && hour === 17 && minute === 0;
  return dow >= 1 && dow <= 5 && hour >= 9 && hour <= 18 && (minute === 0 || minute === 30);
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
