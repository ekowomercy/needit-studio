import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull, ne } from 'drizzle-orm';
import type { Database } from '@needit/db';
import { conversations, messages, needRequests, notifications, users } from '@needit/db';
import { randomUUID } from 'node:crypto';
import { DATABASE } from '../database/database.module';
import type { SendMessageDto } from './dto/conversation.dto';

export interface PublicUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  verificationStatus: string;
  isProvider: boolean;
}

@Injectable()
export class ConversationsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async publicUser(id: string): Promise<PublicUser | null> {
    const row = await this.db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        verificationStatus: users.verificationStatus,
        isProvider: users.isProvider,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const found = row[0];
    if (!found) return null;
    return { ...found, isProvider: found.isProvider === 1 };
  }

  private async getParticipant(id: string, userId: string) {
    const convo = await this.db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
    if (!convo) throw new NotFoundException('Conversation not found');
    if (convo.userId !== userId && convo.providerId !== userId) {
      throw new ForbiddenException('Not a participant in this conversation');
    }
    return convo;
  }

  private async summarize(
    userId: string,
    convo: typeof conversations.$inferSelect,
  ) {
    const otherId = convo.userId === userId ? convo.providerId : convo.userId;
    const other = await this.publicUser(otherId);
    const lastMessage = await this.db.query.messages.findFirst({
      where: eq(messages.conversationId, convo.id),
      orderBy: (m, { desc }) => desc(m.sentAt),
    });
    const unread = await this.db.query.messages.findMany({
      where: (m, { and, eq: eqOp, ne: neOp, isNull: isNullOp }) =>
        and(eqOp(m.conversationId, convo.id), neOp(m.senderId, userId), isNullOp(m.readAt)),
    });
    let needText: string | null = null;
    if (convo.needRequestId) {
      const need = await this.db.query.needRequests.findFirst({
        where: eq(needRequests.id, convo.needRequestId),
      });
      needText = need?.rawText ?? null;
    }
    return {
      id: convo.id,
      userId: convo.userId,
      providerId: convo.providerId,
      needRequestId: convo.needRequestId,
      updatedAt: convo.updatedAt,
      other,
      needText,
      unreadCount: unread.length,
      lastMessage: lastMessage
        ? {
            body: lastMessage.body,
            sentAt: lastMessage.sentAt,
            senderId: lastMessage.senderId,
          }
        : null,
    };
  }

  async listForUser(userId: string) {
    const rows = await this.db.query.conversations.findMany({
      where: (c, { or: orOp, eq: eqOp }) =>
        orOp(eqOp(c.userId, userId), eqOp(c.providerId, userId)),
      orderBy: (c, { desc: descOp }) => descOp(c.updatedAt),
    });
    const summaries = [];
    for (const convo of rows) {
      summaries.push(await this.summarize(userId, convo));
    }
    return summaries;
  }

  async get(id: string, userId: string) {
    const convo = await this.getParticipant(id, userId);
    return this.summarize(userId, convo);
  }

  async listMessages(id: string, userId: string) {
    await this.getParticipant(id, userId);
    return this.db.query.messages.findMany({
      where: eq(messages.conversationId, id),
      orderBy: (m, { asc }) => asc(m.sentAt),
    });
  }

  async send(id: string, userId: string, dto: SendMessageDto) {
    const convo = await this.getParticipant(id, userId);
    const [message] = await this.db
      .insert(messages)
      .values({
        id: `msg_${randomUUID()}`,
        conversationId: id,
        senderId: userId,
        body: dto.body,
        mediaUrls: dto.mediaUrls ?? ([] as string[]),
      })
      .returning();

    await this.db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id));

    const recipientId = convo.userId === userId ? convo.providerId : convo.userId;
    const sender = await this.publicUser(userId);
    await this.db.insert(notifications).values({
      id: `ntf_${randomUUID()}`,
      userId: recipientId,
      type: 'message',
      title: `New message from ${sender?.displayName ?? 'a user'}`,
      body: dto.body.slice(0, 140),
      refId: id,
    });

    return message!;
  }

  async markRead(id: string, userId: string) {
    await this.getParticipant(id, userId);
    await this.db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(eq(messages.conversationId, id), ne(messages.senderId, userId), isNull(messages.readAt)),
      );
    return { ok: true };
  }
}
