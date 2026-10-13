import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '@needit/db';
import { otpCodes } from '@needit/db';
import { DATABASE } from '../database/database.module';
import type { OtpProvider } from './otp.provider';
import { OTP_PROVIDER } from './otp.provider';

@Injectable()
export class OtpTokenService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(OTP_PROVIDER) private readonly otpProvider: OtpProvider,
  ) {}

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  /** Create a 6-digit OTP, store a hash, and dispatch via the active provider. */
  async issue(phone: string, purpose = 'auth'): Promise<{ ttlSeconds: number }> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.db.delete(otpCodes).where(and(eq(otpCodes.phone, phone), eq(otpCodes.purpose, purpose)));
    await this.db.insert(otpCodes).values({
      id: `otp_${randomBytes(8).toString('hex')}`,
      phone,
      purpose,
      codeHash: this.hash(code),
      expiresAt,
    });
    const sent = await this.otpProvider.send(phone, code, purpose);
    if (!sent) {
      // Dev-mode fallback: expose the code via logs so flows are testable.
      console.log(`[otp:dev] ${phone} code=${code}`);
    }
    return { ttlSeconds: 600 };
  }

  async verify(phone: string, code: string, purpose = 'auth'): Promise<boolean> {
    const row = await this.db.query.otpCodes.findFirst({
      where: (c) =>
        and(
          eq(c.phone, phone),
          eq(c.purpose, purpose),
          isNull(c.consumedAt),
        ),
    });
    if (!row) return false;
    if (row.expiresAt.getTime() < Date.now()) return false;
    if (row.attempts >= 5) return false;

    if (this.hash(code) !== row.codeHash) {
      await this.db
        .update(otpCodes)
        .set({ attempts: row.attempts + 1 })
        .where(eq(otpCodes.id, row.id));
      return false;
    }

    await this.db
      .update(otpCodes)
      .set({ consumedAt: new Date(), attempts: row.attempts + 1 })
      .where(eq(otpCodes.id, row.id));
    return true;
  }
}