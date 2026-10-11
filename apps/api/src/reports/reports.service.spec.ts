import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Database } from '@needit/db';
import { users } from '@needit/db';
import { ReportsService } from './reports.service';
import { createTestDb } from '../../test/helpers/db';

async function makeService() {
  const db = await createTestDb();
  return { service: new ReportsService(db), db };
}

async function seedUser(db: Database, name: string) {
  const id = `usr_${randomUUID()}`;
  await db.insert(users).values({ id, displayName: name });
  return id;
}

describe('ReportsService', () => {
  it('creates a report and lists it', async () => {
    const { service, db } = await makeService();
    const reporter = await seedUser(db, 'Reporter');
    const target = await seedUser(db, 'Target');
    const report = await service.create(reporter, {
      targetType: 'user',
      targetId: target,
      reason: 'suspicious_account',
    });
    expect(report.status).toBe('open');
    const list = await service.list();
    expect(list.length).toBe(1);
  });
});
