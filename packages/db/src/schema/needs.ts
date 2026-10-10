import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { NeedStatus } from '@needit/shared';
import type { Intent } from '@needit/shared';
import { users } from './users';

export const needRequests = pgTable('need_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rawText: text('raw_text').notNull(),
  intent: jsonb('intent').$type<Intent>(),
  status: text('status').$type<NeedStatus>().default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export type NeedRequestRow = typeof needRequests.$inferSelect;
export type NewNeedRequest = typeof needRequests.$inferInsert;