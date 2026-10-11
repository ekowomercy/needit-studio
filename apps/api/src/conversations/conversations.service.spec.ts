import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Database } from '@needit/db';
import { conversations, users } from '@needit/db';
import { ConversationsService } from './conversations.service';
import { createTestDb } from '../../test/helpers/db';

async function makeService() {
  const db = await createTestDb();
  return { service: new ConversationsService(db), db };
}

async function seedUser(db: Database, name: string) {
  const id = `usr_${randomUUID()}`;
  await db.insert(users).values({ id, displayName: name });
  return id;
}

async function seedConversation(db: Database, userId: string, providerId: string) {
  const id = `cnv_${randomUUID()}`;
  await db.insert(conversations).values({ id, userId, providerId, needRequestId: null });
  return id;
}

describe('ConversationsService', () => {
  it('sends a message, lists it, and notifies the other participant', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const convoId = await seedConversation(db, seeker, provider);

    const message = await service.send(convoId, seeker, { body: 'Are you available tomorrow?' });
    expect(message.body).toBe('Are you available tomorrow?');
    expect(message.senderId).toBe(seeker);

    const list = await service.listMessages(convoId, provider);
    expect(list).toHaveLength(1);

    const notes = await db.query.notifications.findMany({
      where: (t, { eq }) => eq(t.userId, provider),
    });
    expect(notes.length).toBe(1);
    expect(notes[0]!.type).toBe('message');
  });

  it('forbids non-participants from reading or sending', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const outsider = await seedUser(db, 'Outsider');
    const convoId = await seedConversation(db, seeker, provider);

    await expect(service.listMessages(convoId, outsider)).rejects.toThrow();
    await expect(service.send(convoId, outsider, { body: 'hi' })).rejects.toThrow();
  });

  it('marks messages from the other user as read', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const convoId = await seedConversation(db, seeker, provider);

    await service.send(convoId, provider, { body: 'On my way' });
    await service.markRead(convoId, seeker);

    const list = await service.listMessages(convoId, seeker);
    expect(list[0]!.readAt).not.toBeNull();
  });

  it('lists conversations for both the seeker and the provider', async () => {
    const { service, db } = await makeService();
    const seeker = await seedUser(db, 'Seeker');
    const provider = await seedUser(db, 'Provider');
    const convoId = await seedConversation(db, seeker, provider);
    await service.send(convoId, seeker, { body: 'Hello' });

    const asSeeker = await service.listForUser(seeker);
    const asProvider = await service.listForUser(provider);
    expect(asSeeker).toHaveLength(1);
    expect(asProvider).toHaveLength(1);
    expect(asSeeker[0]!.other?.displayName).toBe('Provider');
    expect(asProvider[0]!.other?.displayName).toBe('Seeker');
    expect(asSeeker[0]!.lastMessage?.body).toBe('Hello');
    expect(asProvider[0]!.unreadCount).toBe(1);
  });
});
