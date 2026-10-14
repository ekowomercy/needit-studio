import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { UserRole } from '@needit/shared';
import type { Database } from '@needit/db';
import { users } from '@needit/db';
import { DATABASE } from '../database/database.module';

@Injectable()
export class AdminService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listUsers() {
    const items = await this.db
      .select({
        id: users.id,
        displayName: users.displayName,
        phone: users.phone,
        email: users.email,
        role: users.role,
        isProvider: users.isProvider,
        locationCity: users.locationCity,
        verificationStatus: users.verificationStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return {
      items: items.map((u) => ({ ...u, isProvider: u.role === 'seller' })),
      total: items.length,
    };
  }

  async setRole(id: string, role: UserRole) {
    const [row] = await this.db
      .update(users)
      .set({ role, isProvider: role === 'seller' ? 1 : 0, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!row) throw new NotFoundException('User not found');
    return { ...row, isProvider: row.role === 'seller' };
  }
}
