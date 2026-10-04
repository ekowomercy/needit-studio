import { describe, expect, it } from 'vitest';
import { formatNaira, parseNaira, toKobo } from '../src/money';

describe('parseNaira', () => {
  it('parses "₦150k"', () => {
    expect(parseNaira('₦150k')).toBe(toKobo(150_000));
  });

  it('parses "under ₦150,000"', () => {
    expect(parseNaira('under ₦150,000')).toBe(toKobo(150_000));
  });

  it('parses "150k" without symbol', () => {
    expect(parseNaira('150k')).toBe(toKobo(150_000));
  });

  it('parses "₦1.2m"', () => {
    expect(parseNaira('₦1.2m')).toBe(toKobo(1_200_000));
  });

  it('parses plain amount with space separator', () => {
    expect(parseNaira('150 000')).toBe(toKobo(150_000));
  });

  it('returns null when no price present', () => {
    expect(parseNaira('I need a plumber')).toBeNull();
  });
});

describe('formatNaira', () => {
  it('formats minor units with symbol', () => {
    expect(formatNaira(toKobo(150_000))).toContain('150,000');
    expect(formatNaira(toKobo(150_000))).toContain('₦');
  });
});