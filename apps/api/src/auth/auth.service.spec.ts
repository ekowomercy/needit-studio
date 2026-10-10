import { describe, expect, it, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpTokenService } from './otp-token.service';
import type { OtpProvider } from './otp.provider';
import { createTestDb } from '../../test/helpers/db';

function makeService() {
  return (async () => {
    const db = await createTestDb();
    const otpProvider: OtpProvider = { send: vi.fn(async () => false) };
    const otp = new OtpTokenService(db, otpProvider);
    const jwt = new JwtService({});
    return { service: new AuthService(db, jwt, otp), db, otpProvider, otp };
  })();
}

describe('AuthService', () => {
  it('signs up with email/password and logs in', async () => {
    const { service } = await makeService();
    await service.signup({
      email: 'ada@example.com',
      password: 'secret123',
      displayName: 'Ada',
    });
    const pair = await service.login({
      email: 'ADA@example.com',
      password: 'secret123',
    });
    expect(pair.accessToken).toBeTruthy();
    expect(pair.refreshToken).toBeTruthy();
    expect(pair.user.email).toBe('ada@example.com');
  });

  it('rejects a wrong password', async () => {
    const { service } = await makeService();
    await service.signup({ email: 'ada@example.com', password: 'secret123' });
    await expect(
      service.login({ email: 'ada@example.com', password: 'nope' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects duplicate signup', async () => {
    const { service } = await makeService();
    await service.signup({ phone: '08011112222' });
    await expect(service.signup({ phone: '08011112222' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates a user via OTP verify flow', async () => {
    const { service, otpProvider } = await makeService();
    let issued = '';
    vi.mocked(otpProvider.send).mockImplementation(async (_p, code) => {
      issued = code;
      return true;
    });
    await service.requestOtp({ phone: '08011112222', purpose: 'auth' });
    expect(issued).toMatch(/^\d{6}$/);
    const pair = await service.verifyOtp({ phone: '08011112222', code: issued, purpose: 'auth' });
    expect(pair.user.phone).toBe('08011112222');
    expect(pair.accessToken).toBeTruthy();
  });

  it('rejects refresh with a bad token', async () => {
    const { service } = await makeService();
    await expect(service.refresh('garbage')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes access with a valid refresh token', async () => {
    const { service } = await makeService();
    const pair = await service.signup({ email: 'ada@example.com', password: 'secret123' });
    const { accessToken } = await service.refresh(pair.refreshToken);
    expect(accessToken).toBeTruthy();
  });
});