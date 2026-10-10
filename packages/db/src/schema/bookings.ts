import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { BookingStatus } from '@needit/shared';
import { users } from './users';
import { listings } from './catalog';
import { needRequests } from './needs';

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  listingId: text('listing_id').references(() => listings.id),
  needRequestId: text('need_request_id').references(() => needRequests.id),
  type: text('type').notNull().default('booking').$type<'booking' | 'order' | 'request_fill'>(),
  status: text('status').$type<BookingStatus>().default('requested').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  quoteKobo: integer('quote_kobo'),
  currency: text('currency').default('NGN').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;