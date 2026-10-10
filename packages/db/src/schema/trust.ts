import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { ReportReason, ReportStatus } from '@needit/shared';
import { users } from './users';

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  bookingId: text('booking_id').unique(),
  rating: integer('rating').notNull(),
  quality: integer('quality'),
  communication: integer('communication'),
  reliability: integer('reliability'),
  value: integer('value'),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const savedItems = pgTable('saved_items', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refType: text('ref_type').notNull().$type<'listing' | 'provider' | 'service'>(),
  refId: text('ref_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull().$type<'provider' | 'listing' | 'user'>(),
  targetId: text('target_id').notNull(),
  reason: text('reason').$type<ReportReason>().notNull(),
  detail: text('detail'),
  status: text('status').$type<ReportStatus>().default('open').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const otpCodes = pgTable('otp_codes', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull(),
  purpose: text('purpose').notNull().default('auth'),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;