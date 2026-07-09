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

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
