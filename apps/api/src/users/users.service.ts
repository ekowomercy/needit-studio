import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '@needit/db';
import { providerProfiles, users, type ProviderProfile } from '@needit/db';
import { randomUUID } from 'node:crypto';
import { DATABASE } from '../database/database.module';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async me(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: (u) => eq(u.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');
    const profile = await this.db.query.providerProfiles.findFirst({
      where: (p) => eq(p.userId, userId),
    });
    return { ...user, isProvider: user.isProvider === 1, providerProfile: profile ?? null };
  }

  async updateMe(userId: string, input: {
    displayName?: string;
    avatarUrl?: string;
    locationCity?: string;
    latitude?: number;
    longitude?: number;
    isProvider?: boolean;
  }) {
    if (typeof input.isProvider === 'boolean' && input.isProvider) {
      await this.ensureProviderProfile(userId);
    }
    await this.db
      .update(users)
      .set({
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        locationCity: input.locationCity,
        latitude: input.latitude,
        longitude: input.longitude,
        isProvider: input.isProvider ? 1 : undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return this.me(userId);
  }

  async getProviderProfile(userId: string) {
    const profile = await this.db.query.providerProfiles.findFirst({
      where: (p) => eq(p.userId, userId),
    });
    if (!profile) throw new NotFoundException('No provider profile');
    return profile;
  }

  async ensureProviderProfile(userId: string): Promise<ProviderProfile> {
    const existing = await this.db.query.providerProfiles.findFirst({
      where: (p) => eq(p.userId, userId),
    });
    if (existing) return existing;
    const [profile] = await this.db
      .insert(providerProfiles)
      .values({ id: `prf_${randomUUID()}`, userId })
      .returning();
    return profile!;
  }

  async upsertProviderProfile(userId: string, input: {
    headline?: string;
    bio?: string;
    areaCity?: string;
    areaRadiusKm?: number;
    startingPriceKobo?: number;
    availability?: { day: string; start: string; end: string }[];
  }) {
    const existing = await this.ensureProviderProfile(userId);
    const [row] = await this.db
      .update(providerProfiles)
      .set({
        headline: input.headline ?? existing.headline,
        bio: input.bio ?? existing.bio,
        areaCity: input.areaCity ?? existing.areaCity,
        areaRadiusKm: input.areaRadiusKm ?? existing.areaRadiusKm,
        startingPriceKobo: input.startingPriceKobo ?? existing.startingPriceKobo,
        availability: input.availability ?? existing.availability,
        updatedAt: new Date(),
      })
      .where(eq(providerProfiles.id, existing.id))
      .returning();
    return row!;
  }
}