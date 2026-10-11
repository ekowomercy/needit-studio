import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Database } from '@needit/db';
import { bookings, users } from '@needit/db';
import { ReviewsService } from './reviews.service';
import { createTestDb } from '../../test/helpers/db';

async function makeService() {
  const db = await createTestDb();
  return { service: new ReviewsService(db), db };
}

async function seedUser(db: Database, name: string) {
  const id = `usr_${randomUUID()}`;
  await db.insert(users).values({ id, displayName: name });
  return id;
}

describe('ReviewsService', () => {
  it('creates a review only after booking is completed and recomputes rating', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const bookingId = `bkg_${randomUUID()}`;
    await db.insert(bookings).values({
      id: bookingId,
      userId: seeker,
      providerId: provider,
      status: 'completed',
      type: 'booking',
    });
    const review = await service.create(seeker, bookingId, { rating: 5, comment: 'Great' });
    expect(review.rating).toBe(5);
    const p = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, provider) });
    expect(p?.ratingAvg).toBe(5);
    expect(p?.reviewCount).toBe(1);
  });
});
