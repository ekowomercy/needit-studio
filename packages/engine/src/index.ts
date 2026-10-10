import type { Budget, Condition, Intent, ResultType, Timing } from '@needit/shared';

export * from './matching';

export const ENGINE_VERSION = '0.1.0';

/** Normalize raw user text for matching and parsing. */
export function normalizeText(raw: string): string {
  const text = raw.replace(/\s+/g, ' ').trim().toLowerCase();
  // Normalize common Nigerian/Naira abbreviations
  return text
    .replace(/₦/g, 'ngn')
    .replace(/k\b/g, '000')
    .replace(/\bunder\b/g, 'under')
    .replace(/,/g, '');
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

const BUDGET_REGEX = /ngn?\s*(\d{2,7})/g;
const UNDER_REGEX = /(under|<=)\s*(ngn\s*)?(\d{1,7})(k)?/;

export function extractBudget(raw: string): Budget | null {
  const text = normalizeText(raw);
  const m = text.match(UNDER_REGEX);
  if (m && (m[3] || m[4])) {
    let num = parseInt(m[3] ?? '0');
    if (m[4] === 'k' || text.includes('k')) num *= 1000;
    return { amount: num * 100, currency: 'NGN', operator: '<=' };
  }
  const matches = [...text.matchAll(BUDGET_REGEX)];
  if (matches.length > 0) {
    const nums = matches.map((x) => parseInt(x[1] ?? '0')).filter((n) => !isNaN(n));
    if (nums.length > 0) {
      const min = Math.min(...nums);
      return { amount: min * 100, currency: 'NGN', operator: '~' };
    }
  }
  return null;
}

export function extractTiming(raw: string): Timing | null {
  const text = normalizeText(raw);
  if (text.includes('tomorrow')) {
    return { date: 'tomorrow', time: null, flexibility: 'flexible' };
  }
  if (text.includes('monday')) {
    return { date: 'monday', time: null, flexibility: 'flexible' };
  }
  if (text.includes('weekend')) {
    return { date: 'weekend', time: null, flexibility: 'flexible' };
  }
  return { date: null, time: null, flexibility: 'flexible' };
}

export function classifyCondition(raw: string): Condition | null {
  const text = normalizeText(raw);
  if (text.includes('used') || text.includes('second hand')) return 'used';
  if (text.includes('new')) return 'new';
  return null;
}

export function extractLocation(_raw: string): { text: string | null } | null {
  return null;
}

export interface LlmIntentClient {
  extract(raw: string): Promise<Partial<Intent> | null>;
}

/**
 * Parse a raw need into a structured Intent. Uses the LLM client when provided
 * and falls back to the deterministic rule engine on any failure (§4.1).
 */
export async function parseIntent(
  raw: string,
  client?: LlmIntentClient | null,
): Promise<Intent> {
  const fallback = parseIntentRule(raw);
  if (!client) return fallback;
  try {
    const partial = await client.extract(raw);
    if (!partial) return fallback;
    return {
      ...fallback,
      ...partial,
      normalizedText: fallback.normalizedText,
      confidence: partial.confidence ?? fallback.confidence,
    };
  } catch {
    return fallback;
  }
}

export function parseIntentRule(raw: string): Intent {
  const normalizedText = normalizeText(raw);
  const resultType = classifyResultType(raw) || 'service';
  const budget = extractBudget(raw);
  const timing = extractTiming(raw);
  const condition = classifyCondition(raw);

  return {
    need: raw,
    resultType,
    categoryTag: resultType === 'product' ? 'product' : resultType,
    condition,
    budget,
    location: { text: null },
    timing,
    audience: null,
    subject: null,
    attributes: {},
    extras: [],
    confidence: 0.6,
    normalizedText,
  };
}