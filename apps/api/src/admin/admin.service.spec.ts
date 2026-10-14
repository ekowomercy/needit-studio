import { describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { createTestDb } from '../../test/helpers/db';
import { users, type Database } from '@needit/db';
import { randomUUID } from 'node:crypto';

async function makeService() {
  const db = await createTestDb();
  return { service: new AdminService(db), db };
}

async function seedUser(db: Database, role: 'admin' | 'seller' | 'buyer' = 'buyer') {
  const id = `usr_${randomUUID()}`;
  await db.insert(users).values({
    id,
    phone: `080${String(Math.floor(10000000 + Math.random() * 89999999))}`,
    displayName: `User ${role}`,
    role,
    isProvider: role === 'seller' ? 1 : 0,
  });
  return id;
}

describe('AdminService', () => {
  it('lists users and derives isProvider from the role', async () => {
    const { service, db } = await makeService();
    await seedUser(db, 'seller');
    await seedUser(db, 'buyer');
    await seedUser(db, 'admin');

    const result = await service.listUsers();
    expect(result.total).toBe(3);
    expect(result.items.find((u) => u.role === 'seller')?.isProvider).toBe(true);
    expect(result.items.find((u) => u.role === 'buyer')?.isProvider).toBe(false);
    expect(result.items.find((u) => u.role === 'admin')?.isProvider).toBe(false);
  });

  it('promotes a buyer to seller and syncs isProvider', async () => {
    const { service, db } = await makeService();
    const id = await seedUser(db, 'buyer');

    const updated = await service.setRole(id, 'seller');
    expect(updated.role).toBe('seller');
    expect(updated.isProvider).toBe(true);
  });

  it('demotes a seller back to buyer', async () => {
    const { service, db } = await makeService();
    const id = await seedUser(db, 'seller');

    const updated = await service.setRole(id, 'buyer');
    expect(updated.role).toBe('buyer');
    expect(updated.isProvider).toBe(false);
  });

  it('throws when setting a role on a missing user', async () => {
    const { service } = await makeService();
    await expect(service.setRole('usr_nope', 'admin')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
