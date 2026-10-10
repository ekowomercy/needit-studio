import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import type { Database } from '@needit/db';
import { users } from '@needit/db';
import { randomUUID } from 'node:crypto';
import { DATABASE } from '../database/database.module';
import { OtpTokenService } from './otp-token.service';
import { LoginDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string | null;
    email: string | null;
    displayName: string | null;
    isProvider: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly otp: OtpTokenService,
  ) {}

  async login(dto: LoginDto): Promise<TokenPair> {
    const row = await this.db.query.users.findFirst({
      where: (u) => eq(u.email, dto.email.toLowerCase()),
    });
    if (!row || !row.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, row.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.tokenPair(row);
  }

  async signup(input: {
    phone?: string;
    email?: string;
    password?: string;
    displayName?: string;
  }): Promise<TokenPair> {
    if (!input.phone && !input.password) {
      throw new BadRequestException('Provide a phone or email/password');
    }
    const existing = await this.db.query.users.findFirst({
      where: (u) =>
        or(
          input.phone ? eq(u.phone, input.phone!) : undefined,
          input.email ? eq(u.email, input.email!) : undefined,
        ),
    });
    if (existing) throw new BadRequestException('Account already exists');
    const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;
    const row = await this.db
      .insert(users)
      .values({
        id: `usr_${randomUUID()}`,
        phone: input.phone,
        email: input.email,
        passwordHash,
        displayName: input.displayName,
      })
      .returning();
    const created = row[0];
    if (!created) throw new BadRequestException('Could not create account');
    return this.tokenPair(created);
  }

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; ttlSeconds: number }> {
    const { ttlSeconds } = await this.otp.issue(dto.phone, dto.purpose ?? 'auth');
    return { message: 'OTP sent', ttlSeconds };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<TokenPair> {
    const ok = await this.otp.verify(dto.phone, dto.code, dto.purpose ?? 'auth');
    if (!ok) throw new BadRequestException('Invalid or expired code');

    let row = await this.db.query.users.findFirst({
      where: (u) => eq(u.phone, dto.phone),
    });
    if (!row) {
      const created = await this.db
        .insert(users)
        .values({ id: `usr_${randomUUID()}`, phone: dto.phone })
        .returning();
      row = created[0];
      if (!row) throw new BadRequestException('Could not create account');
    }
    return this.tokenPair(row);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(
        refreshToken,
        { secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret' },
      );
      if (payload.type !== 'refresh') throw new Error('bad token type');
      const user = await this.db.query.users.findFirst({
        where: (u) => eq(u.id, payload.sub),
      });
      if (!user) throw new Error('no user');
      return {
        accessToken: this.jwt.sign(
          { sub: user.id, phone: user.phone, type: 'access' },
          { secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret', expiresIn: '15m' },
        ),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async tokenPair(row: { id: string; phone: string | null; email: string | null; displayName: string | null; isProvider: number }): Promise<TokenPair> {
    const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
    return {
      accessToken: this.jwt.sign(
        { sub: row.id, phone: row.phone, type: 'access' },
        { secret: accessSecret, expiresIn: '15m' },
      ),
      refreshToken: this.jwt.sign(
        { sub: row.id, type: 'refresh' },
        { secret: refreshSecret, expiresIn: '7d' },
      ),
      user: {
        id: row.id,
        phone: row.phone,
        email: row.email,
        displayName: row.displayName,
        isProvider: row.isProvider === 1,
      },
    };
  }
}