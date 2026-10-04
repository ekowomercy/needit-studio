import type { ResultType } from '@needit/shared';

export const ENGINE_VERSION = '0.1.0';

/** Normalize raw user text for matching and parsing. */
export function normalizeText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Simple keyword heuristics per Buildable PRD §6.2 (fallback engine starter). */
const PROFESSION_KEYWORDS = [
  'plumber',
  'electrician',
  'tutor',
  'designer',
  'photographer',
  'tailor',
  'mechanic',
  'cleaner',
  'hairdresser',
  'caterer',
  'painter',
  'mover',
  'driver',
  'babysitter',
  'nurse',
  'lawyer',
  'accountant',
  'barber',
  'makeup artist',
  'consultant',
];

const ACTIVITY_WORDS = ['repair', 'fix', 'clean', 'design', 'paint', 'wash', 'install', 'move', 'teach', 'deliver'];

const PRODUCT_WORDS = [
  'washing machine',
  'fridge',
  'refrigerator',
  'laptop',
  'phone',
  'tv',
  'television',
  'generator',
  'air conditioner',
  'furniture',
  'car',
  'bike',
  'couch',
  'sofa',
  'phone',
];

export function classifyResultType(raw: string): ResultType | null {
  const text = normalizeText(raw);
  if (PRODUCT_WORDS.some((w) => text.includes(w))) return 'product';
  if (PROFESSION_KEYWORDS.some((w) => text.includes(w))) return 'person';
  if (ACTIVITY_WORDS.some((w) => text.includes(w))) return 'service';
  return null;
}

export function isEventNeed(raw: string): boolean {
  const text = normalizeText(raw);
  return (
    (text.includes('birthday') || text.includes('wedding') || text.includes('party')) &&
    (text.includes('cake') || text.includes('decor') || text.includes('dj'))
  );
}