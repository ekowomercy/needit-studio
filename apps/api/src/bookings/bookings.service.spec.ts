import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Database } from '@needit/db';
import { users } from '@needit/db';
import { BookingsService } from './bookings.service';
import { createTestDb } from '../../test/helpers/db';

async function makeService() {
  const db = await createTestDb();
  return { service: new BookingsService(db), db };
}

async function seedUser(db: Database, name: string) {
  const id = `usr_${randomUUID()}`;
  await db.insert(users).values({ id, displayName: name });
  return id;
}

describe('BookingsService', () => {
  it('creates a booking in requested state and notifies the provider', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');

    const booking = await service.create(seeker, {
      providerId: provider,
      type: 'booking',
      notes: 'Tomorrow 2pm',
    });
    expect(booking.status).toBe('requested');
    expect(booking.userId).toBe(seeker);

    const notes = await db.query.notifications.findMany({
      where: (t, { eq }) => eq(t.userId, provider),
    });
    expect(notes[0]!.type).toBe('booking_received');
  });

  it('prevents booking yourself', async () => {
    const { service, db } = await makeService();
    const user = await seedUser(db, 'Solo');
    await expect(service.create(user, { providerId: user })).rejects.toThrow();
  });

  it('walks the provider lifecycle requested -> confirmed -> in_progress -> completed', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const booking = await service.create(seeker, { providerId: provider });

    const confirmed = await service.updateStatus(booking.id, provider, { status: 'confirmed' });
    expect(confirmed.status).toBe('confirmed');
    const started = await service.updateStatus(booking.id, provider, { status: 'in_progress' });
    expect(started.status).toBe('in_progress');
    const done = await service.updateStatus(booking.id, provider, { status: 'completed' });
    expect(done.status).toBe('completed');
  });

  it('rejects an invalid transition', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const booking = await service.create(seeker, { providerId: provider });

    await expect(
      service.updateStatus(booking.id, provider, { status: 'completed' }),
    ).rejects.toThrow();
  });

  it('does not let the seeker confirm a booking', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const booking = await service.create(seeker, { providerId: provider });

    await expect(
      service.updateStatus(booking.id, seeker, { status: 'confirmed' }),
    ).rejects.toThrow();
  });

  it('lets the seeker cancel a requested booking', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const booking = await service.create(seeker, { providerId: provider });

    const cancelled = await service.updateStatus(booking.id, seeker, { status: 'cancelled' });
    expect(cancelled.status).toBe('cancelled');
  });

  it('lists bookings for both the seeker and the provider', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    await service.create(seeker, { providerId: provider });

    const mine = await service.mine(seeker);
    const forProvider = await service.forProvider(provider);
    expect(mine).toHaveLength(1);
    expect(forProvider).toHaveLength(1);
    expect(mine[0]!.providerName).toBe('Provider');
    expect(forProvider[0]!.seekerName).toBe('Seeker');
  });
});
