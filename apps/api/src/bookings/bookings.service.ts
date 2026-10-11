import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '@needit/db';
import { bookings, listings, notifications, users } from '@needit/db';
import type { BookingStatus } from '@needit/shared';
import { randomUUID } from 'node:crypto';
import { DATABASE } from '../database/database.module';
import type { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  refunded: [],
};

const NOTIFICATION: Record<BookingStatus, { type: string; title: string }> = {
  requested: { type: 'booking_received', title: 'New booking request' },
  confirmed: { type: 'booking_confirmed', title: 'Booking confirmed' },
  in_progress: { type: 'booking_started', title: 'Booking started' },
  completed: { type: 'booking_completed', title: 'Booking completed' },
  cancelled: { type: 'booking_cancelled', title: 'Booking cancelled' },
  refunded: { type: 'booking_refunded', title: 'Booking refunded' },
};

@Injectable()
export class BookingsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async publicName(id: string): Promise<string | null> {
    const row = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    return row?.displayName ?? null;
  }

  private async listingTitle(id: string | null): Promise<string | null> {
    if (!id) return null;
    const row = await this.db.query.listings.findFirst({ where: eq(listings.id, id) });
    return row?.title ?? null;
  }

  private async decorate(rows: (typeof bookings.$inferSelect)[]) {
    const out = [];
    for (const booking of rows) {
      out.push({
        ...booking,
        providerName: await this.publicName(booking.providerId),
        seekerName: await this.publicName(booking.userId),
        listingTitle: await this.listingTitle(booking.listingId),
      });
    }
    return out;
  }

  async create(userId: string, dto: CreateBookingDto) {
    if (dto.providerId === userId) {
      throw new BadRequestException('You cannot book yourself');
    }
    const provider = await this.db.query.users.findFirst({
      where: eq(users.id, dto.providerId),
    });
    if (!provider) throw new NotFoundException('Provider not found');

    const [row] = await this.db
      .insert(bookings)
      .values({
        id: `bkg_${randomUUID()}`,
        userId,
        providerId: dto.providerId,
        listingId: dto.listingId,
        needRequestId: dto.needRequestId,
        type: dto.type ?? 'booking',
        status: 'requested',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        quoteKobo: dto.quoteKobo ?? null,
        notes: dto.notes,
      })
      .returning();

    const seekerName = await this.publicName(userId);
    await this.notify(dto.providerId, 'requested', row!.id, seekerName ?? 'A seeker');
    return row!;
  }

  async mine(userId: string) {
    const rows = await this.db.query.bookings.findMany({
      where: eq(bookings.userId, userId),
      orderBy: (b, { desc: descOp }) => descOp(b.createdAt),
    });
    return this.decorate(rows);
  }

  async forProvider(userId: string) {
    const rows = await this.db.query.bookings.findMany({
      where: eq(bookings.providerId, userId),
      orderBy: (b, { desc: descOp }) => descOp(b.createdAt),
    });
    return this.decorate(rows);
  }

  async find(id: string, userId: string) {
    const booking = await this.db.query.bookings.findFirst({ where: eq(bookings.id, id) });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException('Not a participant in this booking');
    }
    return booking;
  }

  async get(id: string, userId: string) {
    const booking = await this.find(id, userId);
    return {
      ...booking,
      providerName: await this.publicName(booking.providerId),
      seekerName: await this.publicName(booking.userId),
      listingTitle: await this.listingTitle(booking.listingId),
    };
  }

  async updateStatus(id: string, actorId: string, dto: UpdateBookingDto) {
    const booking = await this.find(id, actorId);
    const isProvider = booking.providerId === actorId;
    const isSeeker = booking.userId === actorId;
    const next = dto.status;

    const allowed = TRANSITIONS[booking.status as BookingStatus] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Cannot move booking from ${booking.status} to ${next}`);
    }
    if (!isProvider && next !== 'cancelled') {
      throw new ForbiddenException('Only the provider can confirm, start, or complete a booking');
    }
    if (isSeeker && next === 'cancelled' && !['requested', 'confirmed'].includes(booking.status)) {
      throw new ForbiddenException('This booking can no longer be cancelled');
    }

    const patch: Partial<typeof bookings.$inferInsert> = {
      status: next,
      updatedAt: new Date(),
    };
    if (isProvider && dto.quoteKobo != null) patch.quoteKobo = dto.quoteKobo;
    if (isProvider && dto.scheduledAt) patch.scheduledAt = new Date(dto.scheduledAt);
    if (dto.notes != null) patch.notes = dto.notes;

    const [updated] = await this.db
      .update(bookings)
      .set(patch)
      .where(eq(bookings.id, id))
      .returning();

    const recipientId = isProvider ? booking.userId : booking.providerId;
    const actorName = await this.publicName(actorId);
    await this.notify(recipientId, next, id, actorName ?? 'Your contact');

    return updated!;
  }

  private async notify(
    recipientId: string,
    status: BookingStatus,
    bookingId: string,
    actorName: string,
  ) {
    const meta = NOTIFICATION[status];
    await this.db.insert(notifications).values({
      id: `ntf_${randomUUID()}`,
      userId: recipientId,
      type: meta.type,
      title: meta.title,
      body: `${actorName} · booking ${bookingId}`,
      refId: bookingId,
    });
  }
}
