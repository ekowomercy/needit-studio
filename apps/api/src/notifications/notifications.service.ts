import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '@needit/db';
import { notifications } from '@needit/db';
import { DATABASE } from '../database/database.module';

@Injectable()
export class NotificationsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(userId: string) {
    return this.db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: (n, { desc }) => desc(n.createdAt),
    });
  }

  async unread(userId: string) {
    return this.db.query.notifications.findMany({
      where: (n, { eq, and, isNull }) => and(eq(n.userId, userId), isNull(n.readAt)),
      orderBy: (n, { desc }) => desc(n.createdAt),
    });
  }

  async markRead(userId: string, id: string) {
    const [row] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return { ok: !!row };
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { ok: true };
  }
}
