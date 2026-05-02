const TRANSLIT: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
  'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
  'у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'',
  'э':'e','ю':'yu','я':'ya'
};

export function slugify(str: string): string {
  let s = (str || '').toLowerCase();
  let out = '';
  for (const ch of s) out += TRANSLIT[ch] ?? ch;
  out = out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (out.length > 60) out = out.slice(0, 60).replace(/-[^-]*$/, '');
  return out || 'tag';
}

export function formatRuDate(d: Date): string {
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
