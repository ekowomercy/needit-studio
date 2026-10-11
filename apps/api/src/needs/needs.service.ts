import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '@needit/db';
import {
  categories,
  conversations,
  listings,
  messages,
  needRequests,
  notifications,
  users,
} from '@needit/db';
import type { Intent } from '@needit/shared';
import {
  matchCandidates,
  parseIntent,
  parseIntentRule,
  type MatchCandidate,
  type MatchResult,
} from '@needit/engine';
import { randomUUID } from 'node:crypto';
import { DATABASE } from '../database/database.module';
import { OpenAiIntentClient } from './llm-intent.client';

@Injectable()
export class NeedsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly llm: OpenAiIntentClient,
  ) {}

  async create(userId: string, rawText: string) {
    const id = `need_${randomUUID()}`;
    const intent = await parseIntent(rawText, this.llm);
    await this.db.insert(needRequests).values({
      id,
      userId,
      rawText,
      intent,
      status: 'pending',
    });
    const row = await this.db.query.needRequests.findFirst({
      where: eq(needRequests.id, id),
    });
    const matches = await this.match(intent);
    return { need: row, intent, matches };
  }

  async mine(userId: string) {
    return this.db.query.needRequests.findMany({
      where: eq(needRequests.userId, userId),
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
  }

  async popular(limit = 8) {
    const recent = await this.db.query.needRequests.findMany({
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit: 200,
    });
    const counts = new Map<string, { tag: string; count: number; sample: string }>();
    for (const n of recent) {
      const tag = n.intent?.categoryTag ?? 'other';
      const existing = counts.get(tag);
      if (existing) {
        existing.count++;
      } else {
        counts.set(tag, { tag, count: 1, sample: n.rawText });
      }
    }
    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async get(id: string, userId: string) {
    const n = await this.db.query.needRequests.findFirst({
      where: eq(needRequests.id, id),
    });
    if (!n) throw new NotFoundException('Need not found');
    if (n.userId !== userId) throw new ForbiddenException();
    return n;
  }

  async results(id: string, userId: string): Promise<MatchResult> {
    const n = await this.get(id, userId);
    const intent = (n.intent ?? parseIntentRule(n.rawText)) as Intent;
    return this.match(intent);
  }

  async refine(
    id: string,
    userId: string,
    dto: { text?: string; budget?: string; location?: string },
  ) {
    const n = await this.get(id, userId);
    const base = (n.intent ?? parseIntentRule(n.rawText)) as Intent;
    const patch = `${dto.text ?? ''} ${dto.budget ?? ''}`.trim();
    const reparsed = patch ? parseIntentRule(patch) : null;
    const intent: Intent = {
      ...base,
      budget: reparsed?.budget ?? base.budget,
      location: dto.location ? { text: dto.location } : base.location,
      condition: reparsed?.condition ?? base.condition,
      attributes: { ...base.attributes, ...(reparsed?.attributes ?? {}) },
    };
    await this.db.update(needRequests).set({ intent }).where(eq(needRequests.id, id));
    return { need: { ...n, intent }, intent, matches: await this.match(intent) };
  }

  async contact(
    userId: string,
    needId: string,
    providerId: string,
    message?: string,
  ): Promise<{ conversationId: string }> {
    const need = await this.get(needId, userId);
    const existing = await this.db.query.conversations.findFirst({
      where: (c, { and, eq: eqOp }) =>
        and(
          eqOp(c.userId, userId),
          eqOp(c.providerId, providerId),
          eqOp(c.needRequestId, needId),
        ),
    });

    let conversationId = existing?.id;
    if (!conversationId) {
      conversationId = `cnv_${randomUUID()}`;
      await this.db.insert(conversations).values({
        id: conversationId,
        userId,
        providerId,
        needRequestId: needId,
      });
    }

    const body = message?.trim();
    if (body) {
      await this.db.insert(messages).values({
        id: `msg_${randomUUID()}`,
        conversationId,
        senderId: userId,
        body,
      });
    }

    await this.db.insert(notifications).values({
      id: `ntf_${randomUUID()}`,
      userId: providerId,
      type: 'need_contact',
      title: 'New enquiry about your listing',
      body: body ?? need.rawText,
      refId: needId,
    });

    return { conversationId };
  }

  private async loadCandidates(): Promise<MatchCandidate[]> {
    const rows = await this.db
      .select({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        listingType: listings.listingType,
        categoryId: listings.categoryId,
        categorySlug: categories.slug,
        categoryName: categories.name,
        priceKobo: listings.priceKobo,
        priceType: listings.priceType,
        condition: listings.condition,
        locationCity: listings.locationCity,
        createdAt: listings.createdAt,
        providerId: users.id,
        providerName: users.displayName,
        providerCity: users.locationCity,
        providerLat: users.latitude,
        providerLng: users.longitude,
        ratingAvg: users.ratingAvg,
        reviewCount: users.reviewCount,
        verificationStatus: users.verificationStatus,
      })
      .from(listings)
      .innerJoin(users, eq(listings.providerId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .where(eq(listings.status, 'active'));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      listingType: r.listingType,
      categoryId: r.categoryId,
      categorySlug: r.categorySlug,
      categoryName: r.categoryName,
      priceKobo: r.priceKobo,
      priceType: r.priceType,
      condition: r.condition,
      locationCity: r.locationCity,
      createdAt: r.createdAt,
      provider: {
        id: r.providerId,
        displayName: r.providerName,
        locationCity: r.providerCity,
        latitude: r.providerLat,
        longitude: r.providerLng,
        ratingAvg: r.ratingAvg,
        reviewCount: r.reviewCount,
        verificationStatus: r.verificationStatus,
        areaRadiusKm: 20,
        completedJobs: 0,
        responseRate: null,
      },
    }));
  }

  private async match(intent: Intent): Promise<MatchResult> {
    const candidates = await this.loadCandidates();
    const result = matchCandidates(intent, candidates);
    return { ...result, matches: result.matches.slice(0, 20) };
  }
}
