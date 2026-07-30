// Maps a blog category to the product page most relevant to it.
// Used to link posts into the product pages instead of a generic CTA.
const byCategory: Record<string, string> = {
  'Выгорание': 'profilaktika-vygoraniya',
  'Эмоциональный интеллект': 'upravlenie-stressom',
  'Поколения и команды': 'pokolenie-z',
  'Карьера и удержание': 'individualnye-plany-razvitiya',
  'HR-практики': 'profilaktika-vygoraniya',
  'Кейсы и события': 'kouching-rukovoditeley',
};

export function productSlugForCategory(category: string): string | undefined {
  return byCategory[category];
}
