import { CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import type { Database } from '@needit/db';
import { DATABASE } from '../database/database.module';
import type { AuthUser } from '../auth/auth.guard';

export class AdminGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user) throw new ForbiddenException('Not authenticated');
    const row = await this.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, request.user!.id),
    });
    if (!row || row.role !== 'admin') throw new ForbiddenException('Admin account required');
    return true;
  }
}
