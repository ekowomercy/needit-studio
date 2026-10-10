import { doublePrecision, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import {
  type VerificationStatus,
} from '@needit/shared';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  locationCity: text('location_city'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  isProvider: integer('is_provider')
    .notNull()
    .default(0)
    .$type<0 | 1>(),
  ratingAvg: doublePrecision('rating_avg').default(0).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  verificationStatus: text('verification_status')
    .$type<VerificationStatus>()
    .default('unverified')
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const providerProfiles = pgTable('provider_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  headline: text('headline'),
  bio: text('bio'),
  areaCity: text('area_city'),
  areaRadiusKm: integer('area_radius_km').default(20).notNull(),
  startingPriceKobo: integer('starting_price_kobo'),
  availability: jsonb('availability').$type<
    { day: string; start: string; end: string }[]
  >(),
  verificationStatus: text('verification_status')
    .$type<VerificationStatus>()
    .default('unverified')
    .notNull(),
  responseRate: doublePrecision('response_rate'),
  responseTimeMin: integer('response_time_min'),
  completedJobs: integer('completed_jobs').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type NewProviderProfile = typeof providerProfiles.$inferInsert;