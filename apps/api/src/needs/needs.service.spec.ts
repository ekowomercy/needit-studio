import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Database } from '@needit/db';
import { categories, listings, users } from '@needit/db';
import { NeedsService } from './needs.service';
import { OpenAiIntentClient } from './llm-intent.client';
import { createTestDb } from '../../test/helpers/db';

async function makeService() {
  const db = await createTestDb();
  return { service: new NeedsService(db, new OpenAiIntentClient()), db };
}

async function seedProvider(
  db: Database,
  opts: {
    city: string;
    verified?: boolean;
    rating?: number;
    categoryId?: string;
    slug?: string;
  },
) {
  const userId = `usr_${randomUUID()}`;
  await db.insert(users).values({
    id: userId,
    displayName: 'Provider',
    locationCity: opts.city,
    ratingAvg: opts.rating ?? 4.5,
    reviewCount: 10,
    verificationStatus: opts.verified ? 'verified' : 'unverified',
    isProvider: 1,
  });
  await db.insert(listings).values({
    id: `lst_${randomUUID()}`,
    providerId: userId,
    listingType: 'service',
    title: `${opts.slug ?? 'service'} help in ${opts.city}`,
    description: 'Professional service',
    priceKobo: 5_000_00,
    priceType: 'fixed',
    categoryId: opts.categoryId,
    locationCity: opts.city,
    status: 'active',
  });
  return userId;
}

async function seedCategory(db: Database, slug: string) {
  const id = `cat_${randomUUID()}`;
  await db.insert(categories).values({ id, slug, name: slug, sortOrder: 0 });
  return id;
}

describe('NeedsService', () => {
  it('creates a need, parses intent, and returns matches', async () => {
    const { service, db } = await makeService();
    const catId = await seedCategory(db, 'plumbing');
    const user = `usr_${randomUUID()}`;
    await seedProvider(db, { city: 'Lagos', verified: true, categoryId: catId, slug: 'plumbing' });

    const res = await service.create(user, 'I need a plumber in Lagos');
    expect(res.intent.resultType).toBe('person');
    expect(res.need?.rawText).toBe('I need a plumber in Lagos');
    expect(res.matches.total).toBeGreaterThanOrEqual(1);
  });

  it('lists only the current user needs', async () => {
    const { service } = await makeService();
    await service.create('usr_a', 'I need a plumber');
    await service.create('usr_b', 'I need a tutor');
    const mine = await service.mine('usr_a');
    expect(mine).toHaveLength(1);
    expect(mine[0]!.userId).toBe('usr_a');
  });

  it('refines budget without re-parsing the whole need', async () => {
    const { service, db } = await makeService();
    const catId = await seedCategory(db, 'services');
    await seedProvider(db, { city: 'Lagos', categoryId: catId });
    const created = await service.create('usr_a', 'I need a cleaning service');
    const refined = await service.refine(created.need!.id, 'usr_a', { budget: 'under 20k' });
    expect(refined.intent.budget?.amount).toBe(20_000_00);
    expect(refined.intent.budget?.operator).toBe('<=');
    expect(refined.intent.need).toBe(created.intent.need);
  });

  it('aggregates popular needs by category tag', async () => {
    const { service } = await makeService();
    await service.create('usr_a', 'I need a plumber');
    await service.create('usr_b', 'I need an electrician');
    await service.create('usr_c', 'I need a plumber');
    const popular = await service.popular();
    expect(popular.length).toBeGreaterThanOrEqual(1);
    expect(popular[0]!.count).toBeGreaterThanOrEqual(2);
  });

  it('forbids reading another user need', async () => {
    const { service } = await makeService();
    const created = await service.create('usr_a', 'I need a plumber');
    await expect(service.get(created.need!.id, 'usr_b')).rejects.toThrow();
  });

  it('returns results ranked with verified provider first', async () => {
    const { service, db } = await makeService();
    const catId = await seedCategory(db, 'plumbing');
    await seedProvider(db, { city: 'Lagos', verified: false, categoryId: catId, slug: 'plumbing' });
    await seedProvider(db, { city: 'Lagos', verified: true, categoryId: catId, slug: 'plumbing' });
    const created = await service.create('usr_a', 'I need a plumber in Lagos');
    const results = await service.results(created.need!.id, 'usr_a');
    expect(results.matches.length).toBe(2);
    expect(results.matches[0]!.listing.provider.verificationStatus).toBe('verified');
  });
});
