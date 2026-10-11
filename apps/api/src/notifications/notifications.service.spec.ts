import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Database } from '@needit/db';
import { notifications, users } from '@needit/db';
import { NotificationsService } from './notifications.service';
import { createTestDb } from '../../test/helpers/db';

async function makeService() {
  const db = await createTestDb();
  return { service: new NotificationsService(db), db };
}

async function seedUser(db: Database, name: string) {
  const id = `usr_${randomUUID()}`;
  await db.insert(users).values({ id, displayName: name });
  return id;
}

describe('NotificationsService', () => {
  it('lists and marks notifications read', async () => {
    const { service, db } = await makeService();
    const user = await seedUser(db, 'User');
    await db.insert(notifications).values({
      id: `ntf_${randomUUID()}`,
      userId: user,
      type: 'test',
      title: 'Hello',
    });
    const all = await service.list(user);
    expect(all.length).toBe(1);
    const unread = await service.unread(user);
    expect(unread.length).toBe(1);
    await service.markRead(user, all[0]!.id);
    const unread2 = await service.unread(user);
    expect(unread2.length).toBe(0);
  });
});
