import type { Intent } from '@needit/shared';

export interface MatchProvider {
  id: string;
  displayName: string | null;
  locationCity: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
  reviewCount: number;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  areaRadiusKm: number;
  completedJobs: number;
  responseRate: number | null;
}

export interface MatchCandidate {
  id: string;
  title: string;
  description: string | null;
  listingType: 'product' | 'service';
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  priceKobo: number | null;
  priceType: 'fixed' | 'starting' | 'quote';
  condition: 'new' | 'used' | 'any' | null;
  locationCity: string | null;
  createdAt: Date | string;
  provider: MatchProvider;
}

export interface MatchWeights {
  relevance: number;
  distance: number;
  price: number;
  rating: number;
  trust: number;
  freshness: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  relevance: 0.3,
  distance: 0.2,
  price: 0.15,
  rating: 0.15,
  trust: 0.1,
  freshness: 0.1,
};

export interface ScoredMatch {
  listing: MatchCandidate;
  score: number;
  breakdown: Record<keyof MatchWeights, number>;
  reasons: string[];
}

export interface MatchResult {
  intent: Intent;
  matches: ScoredMatch[];
  total: number;
}

const STOPWORDS = new Set([
  'i',
  'need',
  'a',
  'an',
  'the',
  'for',
  'to',
  'my',
  'me',
  'and',
  'of',
  'in',
  'on',
  'with',
  'someone',
  'that',
  'can',
  'under',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function relevanceScore(intent: Intent, c: MatchCandidate): number {
  const needTokens = new Set(tokenize(intent.need));
  const haystack = tokenize(`${c.title} ${c.description ?? ''} ${c.categoryName ?? ''}`);
  if (needTokens.size === 0 || haystack.length === 0) return 0.2;
  let hits = 0;
  for (const token of haystack) {
    if (needTokens.has(token)) hits++;
  }
  const overlap = Math.min(1, hits / Math.max(1, Math.min(needTokens.size, 6)));
  let typeBonus = 0;
  if (intent.resultType === 'multiple') {
    typeBonus = 0.1;
  } else if (
    (intent.resultType === 'person' && c.listingType === 'service') ||
    intent.resultType === c.listingType
  ) {
    typeBonus = 0.25;
  }
  let categoryBonus = 0;
  if (
    intent.categoryTag &&
    (c.categorySlug === intent.categoryTag ||
      c.categoryName?.toLowerCase() === intent.categoryTag.toLowerCase())
  ) {
    categoryBonus = 0.2;
  }
  return Math.min(1, overlap + typeBonus + categoryBonus);
}

function distanceScore(intent: Intent, c: MatchCandidate): number {
  const seekerCity = intent.location?.text?.toLowerCase().trim();
  const listingCity = c.locationCity?.toLowerCase().trim();
  const providerCity = c.provider.locationCity?.toLowerCase().trim();
  const city = listingCity ?? providerCity;
  if (seekerCity && city && seekerCity === city) return 1;
  if (seekerCity && city) return 0.3;
  return 0.5;
}

function priceScore(intent: Intent, c: MatchCandidate): number {
  const budget = intent.budget;
  if (!budget) return 0.6;
  if (c.priceKobo == null || c.priceType === 'quote') return 0.5;
  if (budget.operator === '<=') {
    if (c.priceKobo <= budget.amount) return 1;
    const over = c.priceKobo / budget.amount;
    return Math.max(0, 1 - (over - 1));
  }
  const ratio = Math.min(c.priceKobo, budget.amount) / Math.max(c.priceKobo, budget.amount);
  return ratio;
}

function trustScore(p: MatchProvider): number {
  if (p.verificationStatus === 'verified') return 1;
  if (p.verificationStatus === 'pending') return 0.6;
  return 0.3;
}

function freshnessScore(createdAt: Date | string): number {
  const t = typeof createdAt === 'string' ? Date.parse(createdAt) : createdAt.getTime();
  if (Number.isNaN(t)) return 0.5;
  const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - days / 30);
}

export function scoreCandidate(
  intent: Intent,
  c: MatchCandidate,
  weights: MatchWeights = DEFAULT_WEIGHTS,
): ScoredMatch {
  const breakdown: Record<keyof MatchWeights, number> = {
    relevance: relevanceScore(intent, c),
    distance: distanceScore(intent, c),
    price: priceScore(intent, c),
    rating: Math.min(1, c.provider.ratingAvg / 5),
    trust: trustScore(c.provider),
    freshness: freshnessScore(c.createdAt),
  };
  const score =
    breakdown.relevance * weights.relevance +
    breakdown.distance * weights.distance +
    breakdown.price * weights.price +
    breakdown.rating * weights.rating +
    breakdown.trust * weights.trust +
    breakdown.freshness * weights.freshness;

  const reasons: string[] = [];
  if (breakdown.relevance >= 0.5) reasons.push('Matches your need');
  if (breakdown.price >= 0.9) reasons.push('Within your budget');
  if (breakdown.distance >= 1) reasons.push('In your area');
  if (c.provider.verificationStatus === 'verified') reasons.push('Verified provider');
  if (c.provider.ratingAvg >= 4.5 && c.provider.reviewCount > 0) reasons.push('Highly rated');

  return { listing: c, score: Number(score.toFixed(4)), breakdown, reasons };
}

export function passesHardFilters(intent: Intent, c: MatchCandidate): boolean {
  if (intent.budget && c.priceType !== 'quote' && c.priceKobo != null) {
    if (intent.budget.operator === '<=' && c.priceKobo > intent.budget.amount) {
      return false;
    }
  }
  if (intent.condition && intent.condition !== 'any' && c.condition && c.condition !== 'any') {
    if (c.condition !== intent.condition) return false;
  }
  return true;
}

export function matchCandidates(
  intent: Intent,
  candidates: MatchCandidate[],
  weights: MatchWeights = DEFAULT_WEIGHTS,
): MatchResult {
  const scored = candidates
    .filter((c) => passesHardFilters(intent, c))
    .map((c) => scoreCandidate(intent, c, weights))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aVerified = a.listing.provider.verificationStatus === 'verified' ? 1 : 0;
      const bVerified = b.listing.provider.verificationStatus === 'verified' ? 1 : 0;
      return bVerified - aVerified;
    });
  return { intent, matches: scored, total: scored.length };
}
