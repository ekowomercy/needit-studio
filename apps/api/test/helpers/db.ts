import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { Database } from '@needit/db';
import { schema } from '@needit/db';
import { sql } from 'drizzle-orm';

export async function createTestDb(): Promise<Database> {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "users" (
    "id" text PRIMARY KEY NOT NULL,
    "phone" text UNIQUE,
    "email" text UNIQUE,
    "password_hash" text,
    "display_name" text,
    "avatar_url" text,
    "location_city" text,
    "latitude" double precision,
    "longitude" double precision,
    "is_provider" integer DEFAULT 0 NOT NULL,
    "role" text DEFAULT 'buyer' NOT NULL,
    "rating_avg" double precision DEFAULT 0 NOT NULL,
    "review_count" integer DEFAULT 0 NOT NULL,
    "verification_status" text DEFAULT 'unverified' NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "provider_profiles" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL UNIQUE,
    "headline" text,
    "bio" text,
    "area_city" text,
    "area_radius_km" integer DEFAULT 20 NOT NULL,
    "starting_price_kobo" integer,
    "availability" jsonb,
    "verification_status" text DEFAULT 'unverified' NOT NULL,
    "response_rate" double precision,
    "response_time_min" integer,
    "completed_jobs" integer DEFAULT 0 NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "categories" (
    "id" text PRIMARY KEY NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "icon" text,
    "parent_id" text,
    "sort_order" integer DEFAULT 0 NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "listings" (
    "id" text PRIMARY KEY NOT NULL,
    "provider_id" text NOT NULL,
    "listing_type" text NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "price_kobo" integer,
    "price_type" text DEFAULT 'quote' NOT NULL,
    "condition" text DEFAULT 'any',
    "images" text[],
    "category_id" text,
    "location_city" text,
    "delivery" jsonb,
    "status" text DEFAULT 'draft' NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "need_requests" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "raw_text" text NOT NULL,
    "intent" jsonb,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "expires_at" timestamptz
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "bookings" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "listing_id" text,
    "need_request_id" text,
    "type" text DEFAULT 'booking' NOT NULL,
    "status" text DEFAULT 'requested' NOT NULL,
    "scheduled_at" timestamptz,
    "quote_kobo" integer,
    "currency" text DEFAULT 'NGN' NOT NULL,
    "notes" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "conversations" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "need_request_id" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "messages" (
    "id" text PRIMARY KEY NOT NULL,
    "conversation_id" text NOT NULL,
    "sender_id" text NOT NULL,
    "body" text,
    "media_urls" text[],
    "sent_at" timestamptz DEFAULT now() NOT NULL,
    "read_at" timestamptz
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "notifications" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "type" text NOT NULL,
    "title" text NOT NULL,
    "body" text,
    "ref_id" text,
    "read_at" timestamptz,
    "created_at" timestamptz DEFAULT now() NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "reviews" (
    "id" text PRIMARY KEY NOT NULL,
    "author_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "booking_id" text UNIQUE,
    "rating" integer NOT NULL,
    "quality" integer,
    "communication" integer,
    "reliability" integer,
    "value" integer,
    "comment" text,
    "created_at" timestamptz DEFAULT now() NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "saved_items" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "ref_type" text NOT NULL,
    "ref_id" text NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "reports" (
    "id" text PRIMARY KEY NOT NULL,
    "reporter_id" text NOT NULL,
    "target_type" text NOT NULL,
    "target_id" text NOT NULL,
    "reason" text NOT NULL,
    "detail" text,
    "status" text DEFAULT 'open' NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "resolved_at" timestamptz
  );`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS "otp_codes" (
    "id" text PRIMARY KEY NOT NULL,
    "phone" text NOT NULL,
    "purpose" text DEFAULT 'auth' NOT NULL,
    "code_hash" text NOT NULL,
    "expires_at" timestamptz NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "consumed_at" timestamptz,
    "created_at" timestamptz DEFAULT now() NOT NULL
  );`);

  return db as unknown as Database;
}