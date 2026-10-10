import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import type { Condition, ListingStatus, ListingType, PriceType } from '@needit/shared';
import { users } from './users';

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  icon: text('icon'),
  parentId: text('parent_id').references((): AnyPgColumn => categories.id),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const listings = pgTable('listings', {
  id: text('id').primaryKey(),
  providerId: text('provider_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  listingType: text('listing_type').$type<ListingType>().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  priceKobo: integer('price_kobo'),
  priceType: text('price_type').$type<PriceType>().default('quote').notNull(),
  condition: text('condition').$type<Condition>().default('any'),
  images: text('images').array(),
  categoryId: text('category_id').references(() => categories.id),
  locationCity: text('location_city'),
  delivery: jsonb('delivery').$type<{
    localPickup: boolean;
    deliveryAvailable: boolean;
    deliveryCostKobo?: number | null;
  }>(),
  status: text('status').$type<ListingStatus>().default('draft').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;