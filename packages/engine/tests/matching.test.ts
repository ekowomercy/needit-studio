import { describe, expect, it } from 'vitest';
import type { Intent } from '@needit/shared';
import {
  matchCandidates,
  passesHardFilters,
  scoreCandidate,
  type MatchCandidate,
} from '../src/index';
import { parseIntentRule } from '../src/index';

function makeCandidate(overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    id: 'lst_1',
    title: 'Leaking tap repair service',
    description: 'We fix plumbing issues fast',
    listingType: 'service',
    categoryId: 'cat_plumbing',
    categorySlug: 'plumbing',
    categoryName: 'Plumbing',
    priceKobo: 5_000_00,
    priceType: 'fixed',
    condition: 'any',
    locationCity: 'Lagos',
    createdAt: new Date(),
    provider: {
      id: 'usr_1',
      displayName: 'Ada Plumber',
      locationCity: 'Lagos',
      latitude: 6.45,
      longitude: 3.39,
      ratingAvg: 4.8,
      reviewCount: 20,
      verificationStatus: 'verified',
      areaRadiusKm: 20,
      completedJobs: 50,
      responseRate: 0.9,
    },
    ...overrides,
  };
}

const intent: Intent = {
  need: 'I need a plumber to fix a leaking tap in Lagos under 10k',
  resultType: 'person',
  categoryTag: 'person',
  condition: null,
  budget: { amount: 1_000_000, currency: 'NGN', operator: '<=' },
  location: { text: 'Lagos' },
  timing: null,
  audience: null,
  subject: null,
  attributes: {},
  extras: [],
  confidence: 0.6,
  normalizedText: 'i need a plumber to fix a leaking tap in lagos under 10000',
};

describe('engine matching', () => {
  it('excludes candidates over budget (hard filter)', () => {
    const over = makeCandidate({ id: 'over', priceKobo: 2_000_000 });
    expect(passesHardFilters(intent, over)).toBe(false);
    const under = makeCandidate({ id: 'under', priceKobo: 800_000 });
    expect(passesHardFilters(intent, under)).toBe(true);
  });

  it('ranks verified providers above unverified at equal score', () => {
    const verified = makeCandidate({
      id: 'v',
      provider: { ...makeCandidate().provider, id: 'v', verificationStatus: 'verified' },
    });
    const unverified = makeCandidate({
      id: 'u',
      provider: { ...makeCandidate().provider, id: 'u', verificationStatus: 'unverified' },
    });
    // Force equal non-trust score by matching everything else
    const a = scoreCandidate(intent, verified);
    const b = scoreCandidate(intent, unverified);
    expect(a.score).toBeGreaterThan(b.score);
  });

  it('sorts matches by score descending', () => {
    const strong = makeCandidate({ id: 'strong' });
    const weak = makeCandidate({
      id: 'weak',
      title: 'Unrelated product',
      description: 'nothing relevant',
      listingType: 'product',
      categorySlug: 'fashion',
      categoryName: 'Fashion',
      locationCity: 'Abuja',
      priceKobo: 990_000,
      provider: {
        ...makeCandidate().provider,
        id: 'weakp',
        ratingAvg: 2,
        verificationStatus: 'unverified',
        locationCity: 'Abuja',
      },
    });
    const res = matchCandidates(intent, [weak, strong]);
    expect(res.matches[0]!.listing.id).toBe('strong');
    expect(res.total).toBe(2);
  });

  it('produces human-readable reasons', () => {
    const scored = scoreCandidate(intent, makeCandidate());
    expect(scored.reasons).toContain('Within your budget');
    expect(scored.reasons).toContain('Verified provider');
    expect(scored.reasons).toContain('In your area');
    expect(scored.score).toBeGreaterThan(0.5);
  });

  it('integrates with rule parser budget (under 150k)', () => {
    const parsed = parseIntentRule('I need a used washing machine under 150k');
    expect(parsed.budget?.operator).toBe('<=');
    expect(parsed.budget?.amount).toBe(150_000_00);
  });
});
