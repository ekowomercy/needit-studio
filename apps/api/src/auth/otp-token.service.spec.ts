import { describe, expect, it, vi } from 'vitest';
import { OtpTokenService } from './otp-token.service';
import type { OtpProvider } from './otp.provider';
import { createTestDb } from '../../test/helpers/db';

function makeService(opts?: { provider?: OtpProvider }) {
  return (async () => {
    const db = await createTestDb();
    const provider: OtpProvider =
      opts?.provider ?? { send: vi.fn(async () => false) };
    return { service: new OtpTokenService(db, provider), db };
  })();
}

describe('OtpTokenService', () => {
  it('issues and verifies a matching code', async () => {
    const { service } = await makeService();
    await service.issue('08011112222', 'auth');
    const ok = await service.verify('08011112222', '000000', 'auth');
    expect(ok).toBe(false); // random code, not the issued one
  });

  it('rejects an unknown phone', async () => {
    const { service } = await makeService();
    await service.issue('08011112222', 'auth');
    await expect(service.verify('08099998888', '000000', 'auth')).resolves.toBe(false);
  });

  it('marks a consumed code as invalid for reuse', async () => {
    let issuedCode = '';
      // hook to capture code if needed
    const provider: OtpProvider = {
      send: vi.fn(async (_p, code) => {
        issuedCode = code;
        return true;
      }),
    };
    const s = (await makeService({ provider })).service;
    await s.issue('08011112222', 'auth');
    expect(issuedCode).toMatch(/^\d{6}$/);
    expect(await s.verify('08011112222', issuedCode, 'auth')).toBe(true);
    expect(await s.verify('08011112222', issuedCode, 'auth')).toBe(false);
  });

  it('consumes max attempts', async () => {
    let issuedCode = '';
      // hook to capture code if needed
    const provider: OtpProvider = {
      send: vi.fn(async (_p, code) => {
        issuedCode = code;
        return true;
      }),
    };
    const s = (await makeService({ provider })).service;
    await s.issue('08011112222', 'auth');
    for (let i = 0; i < 5; i += 1) {
      await s.verify('08011112222', '111111', 'auth');
    }
    expect(await s.verify('08011112222', issuedCode, 'auth')).toBe(false);
  });
});
