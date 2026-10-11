import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '@needit/db';
import { reports } from '@needit/db';
import { randomUUID } from 'node:crypto';
import { DATABASE } from '../database/database.module';
import type { UpdateReportDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(reporterId: string, dto: {
    targetType: 'provider' | 'listing' | 'user';
    targetId: string;
    reason: any;
    detail?: string;
  }) {
    const [row] = await this.db
      .insert(reports)
      .values({
        id: `rpt_${randomUUID()}`,
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        detail: dto.detail,
        status: 'open',
      })
      .returning();
    return row!;
  }

  async list(_admin = false) {
    const rows = await this.db.query.reports.findMany({
      orderBy: (r, { desc }) => desc(r.createdAt),
    });
    return rows;
  }

  async update(id: string, dto: UpdateReportDto) {
    const row = await this.db.query.reports.findFirst({ where: eq(reports.id, id) });
    if (!row) throw new NotFoundException('Report not found');
    const [updated] = await this.db
      .update(reports)
      .set({ status: dto.status ?? row.status, resolvedAt: dto.status === 'resolved' || dto.status === 'dismissed' ? new Date() : undefined })
      .where(eq(reports.id, id))
      .returning();
    return updated!;
  }
}
