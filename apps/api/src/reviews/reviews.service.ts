import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import type { Database } from '@needit/db';
import { bookings, reviews, users } from '@needit/db';
import { randomUUID } from 'node:crypto';
import { DATABASE } from '../database/database.module';

@Injectable()
export class ReviewsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async recomputeRating(providerId: string) {
    const [agg] = await this.db
      .select({
        avg: sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.providerId, providerId));
    await this.db
      .update(users)
      .set({
        ratingAvg: agg?.avg ?? 0,
        reviewCount: agg?.count ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, providerId));
  }

  async create(userId: string, bookingId: string, dto: {
    rating: number;
    quality?: number;
    communication?: number;
    reliability?: number;
    value?: number;
    comment?: string;
  }) {
    const booking = await this.db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Only the seeker can review');
    if (booking.status !== 'completed') throw new BadRequestException('Only completed bookings can be reviewed');
    const existing = await this.db.query.reviews.findFirst({
      where: eq(reviews.bookingId, bookingId),
    });
    if (existing) throw new BadRequestException('Booking already reviewed');
    const [row] = await this.db
      .insert(reviews)
      .values({
        id: `rev_${randomUUID()}`,
        authorId: userId,
        providerId: booking.providerId,
        bookingId,
        rating: dto.rating,
        quality: dto.quality,
        communication: dto.communication,
        reliability: dto.reliability,
        value: dto.value,
        comment: dto.comment,
      })
      .returning();
    await this.recomputeRating(booking.providerId);
    return row!;
  }

  async forProvider(providerId: string, page = 1, pageSize = 20) {
    const items = await this.db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        quality: reviews.quality,
        communication: reviews.communication,
        reliability: reviews.reliability,
        value: reviews.value,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
      })
      .from(reviews)
      .where(eq(reviews.providerId, providerId))
      .innerJoin(users, eq(users.id, reviews.authorId))
      .orderBy(desc(reviews.createdAt))
      .limit(Math.min(50, pageSize))
      .offset((page - 1) * pageSize);
    return { items, page, pageSize };
  }
}
