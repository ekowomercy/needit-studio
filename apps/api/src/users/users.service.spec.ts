import { describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { createTestDb } from '../../test/helpers/db';
import { users, type Database } from '@needit/db';
import { randomUUID } from 'node:crypto';

async function makeService() {
  const db = await createTestDb();
  return { service: new UsersService(db), db };
}

async function seedUser(db: Database, isProvider: 0 | 1 = 0) {
  const row = {
    id: `usr_${randomUUID()}`,
    phone: `080${String(Math.floor(10000000 + Math.random() * 89999999))}`,
    displayName: 'Test User',
    isProvider,
  };
  await db.insert(users).values(row);
  return row;
}

describe('UsersService', () => {
  it('returns the user with no provider profile attached', async () => {
    const { service, db } = await makeService();
    const user = await seedUser(db);
    const me = await service.me(user.id);
    expect(me.id).toBe(user.id);
    expect(me.providerProfile).toBeNull();
  });

  it('throws for an unknown user', async () => {
    const { service } = await makeService();
    await expect(service.me('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates displayName', async () => {
    const { service, db } = await makeService();
    const user = await seedUser(db);
    await service.updateMe(user.id, { displayName: 'Ada' });
    expect((await service.me(user.id)).displayName).toBe('Ada');
  });

  it('creates a provider profile on demand', async () => {
    const { service, db } = await makeService();
    const user = await seedUser(db);
    const profile = await service.ensureProviderProfile(user.id);
    expect(profile.userId).toBe(user.id);
    const again = await service.ensureProviderProfile(user.id);
    expect(again.id).toBe(profile.id);
  });

  it('throws when reading a profile that does not exist', async () => {
    const { service } = await makeService();
    await expect(service.getProviderProfile('usr_nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});