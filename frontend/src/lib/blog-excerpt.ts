const isWordChar = (ch: string) => /[\p{L}\p{N}]/u.test(ch);
const SENTENCE_END = /[.!?:;]|\p{Extended_Pictographic}/u;

/**
 * Imported Telegram posts often start the excerpt with the title (which itself is
 * the post's first sentence, sometimes cut mid-phrase). If the excerpt repeats the
 * title and the title ends on a sentence boundary, the repeat is dropped; if the
 * title was cut mid-sentence, the remainder would start mid-phrase, so no excerpt
 * is shown at all (it would only duplicate the title).
 */
export function cleanExcerpt(title: string, excerpt?: string): string | undefined {
  if (!excerpt) return excerpt;
  const titleChars = [...title.replace(/…\s*$/, '')].filter(isWordChar).map((c) => c.toLowerCase());
  if (titleChars.length < 8) return excerpt;

  const chars = [...excerpt];
  let t = 0;
  let i = 0;
  for (; i < chars.length && t < titleChars.length; i++) {
    if (!isWordChar(chars[i])) continue;
    if (chars[i].toLowerCase() !== titleChars[t]) return excerpt;
    t++;
  }
  if (t < titleChars.length) return excerpt;
  if (i < chars.length && isWordChar(chars[i])) return undefined;

  let sep = '';
  while (i < chars.length && !isWordChar(chars[i]) && !'«"'.includes(chars[i])) sep += chars[i++];
  const rest = chars.slice(i).join('').trim();
  if (!SENTENCE_END.test(sep) || rest.replace(/…$/, '').length < 30) return undefined;
  return rest;
}
