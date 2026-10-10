import { describe, expect, it } from 'vitest';
import { CatalogService } from './catalog.service';
import { createTestDb } from '../../test/helpers/db';
import { categories } from '@needit/db';
import { randomUUID } from 'node:crypto';
import type { Database } from '@needit/db';

async function seed(db: Database) {
  const parent = { id: `cat_p${randomUUID()}`, slug: 'home-services', name: 'Home Services', icon: '🔧', sortOrder: 0 };
  const child = { id: `cat_c${randomUUID()}`, slug: 'plumbing', name: 'Plumbing', icon: '🔧', parentId: parent.id, sortOrder: 0 };
  await db.insert(categories).values(parent);
  await db.insert(categories).values(child);
  return { parent, child };
}

async function makeService() {
  const db = await createTestDb();
  return { service: new CatalogService(db), db };
}

describe('CatalogService', () => {
  it('returns an empty category tree when none exist', async () => {
    const { service } = await makeService();
    expect(await service.categoryTree()).toEqual([]);
  });

  it('returns the category tree with children nested', async () => {
    const { service, db } = await makeService();
    const { parent, child } = await seed(db);
    const tree = await service.categoryTree();
    expect(tree).toHaveLength(1);
    expect(tree[0]!.id).toBe(parent.id);
    expect(tree[0]!.children?.[0]?.id).toBe(child.id);
  });

  it('creates and lists a provider listing', async () => {
    const { service, db } = await makeService();
    const providerId = `usr_${randomUUID()}`;
    const { child } = await seed(db);
    const listing = await service.createListing(providerId, {
      listingType: 'service',
      title: 'Leaking tap fix',
      priceKobo: 5_000_00,
      categoryId: child.id,
      status: 'active',
    });
    const res = await service.listListings({});
    expect(res.items).toHaveLength(1);
    expect(res.items[0]!.id).toBe(listing!.id);
  });

  it('draft listings are not returned publicly', async () => {
    const { service } = await makeService();
    const providerId = `usr_${randomUUID()}`;
    await service.createListing(providerId, {
      listingType: 'product',
      title: 'Hidden item',
      status: 'draft',
    });
    const res = await service.listListings({});
    expect(res.items).toHaveLength(0);
  });

  it('only the owner can delete a listing', async () => {
    const { service, db } = await makeService();
    const owner = `usr_${randomUUID()}`;
    const other = `usr_${randomUUID()}`;
    const { child } = await seed(db);
    const listing = await service.createListing(owner, {
      listingType: 'service',
      title: 'Owner only',
      categoryId: child.id,
      status: 'active',
    });
    expect(await service.deleteListing(listing!.id, other)).toBe(false);
    expect(await service.deleteListing(listing!.id, owner)).toBe(true);
  });

  it('filters listings by keyword', async () => {
    const { service, db } = await makeService();
    const { child } = await seed(db);
    await service.createListing(`usr_${randomUUID()}`, {
      listingType: 'product',
      title: 'Samsung Galaxy A54',
      status: 'active',
      categoryId: child.id,
    });
    await service.createListing(`usr_${randomUUID()}`, {
      listingType: 'product',
      title: 'Used fridge',
      status: 'active',
      categoryId: child.id,
    });
    const samsung = await service.listListings({ q: 'samsung' });
    expect(samsung.items).toHaveLength(1);
  });
});