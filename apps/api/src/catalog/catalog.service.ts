import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import type { Database } from '@needit/db';
import type { Condition, ListingType } from '@needit/shared';
import { listings, providerProfiles, reviews, users } from '@needit/db';
import { randomUUID } from 'node:crypto';
import { DATABASE } from '../database/database.module';

export interface ListingInput {
  listingType: ListingType;
  title: string;
  description?: string;
  priceKobo?: number;
  priceType?: 'starting' | 'fixed' | 'quote';
  condition?: Condition | null;
  images?: string[];
  categoryId?: string;
  locationCity?: string;
  delivery?: { localPickup: boolean; deliveryAvailable: boolean; deliveryCostKobo?: number | null };
  status?: 'draft' | 'active' | 'paused';
}

@Injectable()
export class CatalogService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async categories() {
    return this.db.query.categories.findMany({
      orderBy: (c, { asc }) => asc(c.sortOrder),
    });
  }

  async categoryTree() {
    const all = await this.categories();
    const byId = new Map<string, (typeof all)[number] & { children?: (typeof all)[number][] }>();
    const roots: ((typeof all)[number] & { children?: (typeof all)[number][] })[] = [];
    for (const cat of all) {
      byId.set(cat.id, cat);
    }
    for (const cat of all) {
      if (cat.parentId && byId.has(cat.parentId)) {
        const parent = byId.get(cat.parentId)!;
        (parent.children ??= []).push(cat);
      } else {
        roots.push(cat);
      }
    }
    return roots;
  }

  private async resolveCategoryIds(slug: string): Promise<string[]> {
    const parents = await this.db.query.categories.findMany({
      where: (c, { eq }) => eq(c.slug, slug),
    });
    if (parents.length === 0) return [];
    const parentIds = parents.map((p) => p.id);
    const kids = await this.db.query.categories.findMany({
      where: (c, { inArray }) => inArray(c.parentId, parentIds),
    });
    return [...parentIds, ...kids.map((k) => k.id)];
  }

  async listListings(input: {
    q?: string;
    type?: string;
    categorySlug?: string;
    city?: string;
    status?: string;
    providerId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 20));
    const status = input.status ?? 'active';

    const conditions: SQL[] = [eq(listings.status, status as 'active')];
    if (input.type) conditions.push(eq(listings.listingType, input.type as 'product' | 'service'));
    if (input.city) conditions.push(eq(listings.locationCity, input.city));
    if (input.providerId) conditions.push(eq(listings.providerId, input.providerId));
    if (input.categorySlug) {
      const ids = await this.resolveCategoryIds(input.categorySlug);
      if (ids.length > 0) conditions.push(inArray(listings.categoryId, ids));
    }
    if (input.q) {
      const needle = `%${input.q.trim().toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${listings.title})`, needle),
          like(sql`lower(coalesce(${listings.description}, ''))`, needle),
        ) as any,
      );
    }

    const items = await this.db
      .select({
        id: listings.id,
        providerId: listings.providerId,
        listingType: listings.listingType,
        title: listings.title,
        description: listings.description,
        priceKobo: listings.priceKobo,
        priceType: listings.priceType,
        images: listings.images,
        locationCity: listings.locationCity,
        status: listings.status,
        createdAt: listings.createdAt,
      })
      .from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { items, page, pageSize };
  }

  async getListing(id: string) {
    const listing = await this.db.query.listings.findFirst({
      where: (l, { eq }) => eq(l.id, id),
    });
    if (!listing) return null;
    const provider = await this.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, listing.providerId),
    });
    const profile = await this.db.query.providerProfiles.findFirst({
      where: (p, { eq }) => eq(p.userId, listing.providerId),
    });
    return { ...listing, provider, providerProfile: profile };
  }

  async createListing(providerId: string, input: ListingInput) {
    const [row] = await this.db
      .insert(listings)
      .values({
        id: `lst_${randomUUID()}`,
        providerId,
        listingType: input.listingType,
        title: input.title,
        description: input.description,
        priceKobo: input.priceKobo,
        priceType: input.priceType ?? 'quote',
        condition: input.condition ?? 'any',
        images: input.images ?? ([] as string[]),
        categoryId: input.categoryId,
        locationCity: input.locationCity,
        delivery: input.delivery,
        status: input.status ?? 'draft',
      })
      .returning();
    return row!;
  }

  async updateListing(id: string, providerId: string, input: Partial<ListingInput>) {
    const existing = await this.db.query.listings.findFirst({
      where: (l, { eq }) => eq(l.id, id),
    });
    if (!existing || existing.providerId !== providerId) return null;
    const [row] = await this.db
      .update(listings)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return row!;
  }

  async deleteListing(id: string, providerId: string): Promise<boolean> {
    const existing = await this.db.query.listings.findFirst({
      where: (l, { eq }) => eq(l.id, id),
    });
    if (!existing || existing.providerId !== providerId) return false;
    await this.db.delete(listings).where(eq(listings.id, id));
    return true;
  }

  async providerProfiles(input: { q?: string; city?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 20));
    const items = await this.db
      .select({
        id: providerProfiles.id,
        userId: providerProfiles.userId,
        headline: providerProfiles.headline,
        bio: providerProfiles.bio,
        areaCity: providerProfiles.areaCity,
        startingPriceKobo: providerProfiles.startingPriceKobo,
        responseRate: providerProfiles.responseRate,
        responseTimeMin: providerProfiles.responseTimeMin,
        completedJobs: providerProfiles.completedJobs,
        verificationStatus: providerProfiles.verificationStatus,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        ratingAvg: users.ratingAvg,
        reviewCount: users.reviewCount,
      })
      .from(providerProfiles)
      .innerJoin(users, eq(users.id, providerProfiles.userId))
      .orderBy(desc(users.reviewCount))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    return { items, page, pageSize };
  }

  async providerProfile(userId: string) {
    const rows = await this.db
      .select({
        id: providerProfiles.id,
        userId: providerProfiles.userId,
        headline: providerProfiles.headline,
        bio: providerProfiles.bio,
        areaCity: providerProfiles.areaCity,
        areaRadiusKm: providerProfiles.areaRadiusKm,
        startingPriceKobo: providerProfiles.startingPriceKobo,
        availability: providerProfiles.availability,
        responseRate: providerProfiles.responseRate,
        responseTimeMin: providerProfiles.responseTimeMin,
        completedJobs: providerProfiles.completedJobs,
        verificationStatus: providerProfiles.verificationStatus,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        locationCity: users.locationCity,
        ratingAvg: users.ratingAvg,
        reviewCount: users.reviewCount,
      })
      .from(providerProfiles)
      .innerJoin(users, eq(users.id, providerProfiles.userId))
      .where(eq(providerProfiles.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async providerListings(userId: string) {
    return this.listListings({ providerId: userId, status: 'active', pageSize: 50 });
  }

  async listReviews(providerId: string, page = 1, pageSize = 20) {
    const rows = await this.db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        quality: reviews.quality,
        communication: reviews.communication,
        reliability: reviews.reliability,
        value: reviews.value,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
      })
      .from(reviews)
      .where(eq(reviews.providerId, providerId))
      .innerJoin(users, eq(users.id, reviews.authorId))
      .orderBy(desc(reviews.createdAt))
      .limit(Math.min(50, pageSize))
      .offset((page - 1) * pageSize);
    return { items: rows, page, pageSize };
  }
}