const NAIRA = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

const NAIRA_PLAIN = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

/** Convert major units (naira) to minor units (kobo). */
export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

/** Convert minor units (kobo) to major units (naira). */
export function toNaira(kobo: number): number {
  return kobo / 100;
}

/** Format minor units as a ₦ string, e.g. 15_000_000 kobo -> "₦150,000". */
export function formatNaira(kobo: number): string {
  return NAIRA.format(toNaira(kobo));
}

/** Format minor units without symbol, e.g. 15_000_000 -> "150,000". */
export function formatNairaPlain(kobo: number): string {
  return NAIRA_PLAIN.format(kobo / 100);
}

/**
 * Parse Nigerian price text into minor units (kobo).
 * Handles "₦150k", "150,000", "150k", "₦1.2m", "150 000", "N150".
 * Returns null when no price is found.
 */
export function parseNaira(raw: string): number | null {
  const trimmed = raw.trim();
  const match = trimmed.match(
    /(?:₦|N\s?|\$)?\s*([0-9][0-9,\s.]*)(k|m)?\b/i,
  );
  if (!match) return null;

  const [, numberPart, suffix] = match;
  const digits = Number((numberPart ?? '').replace(/[,\s]/g, ''));
  if (!Number.isFinite(digits)) return null;

  const multiplier = (suffix ?? '').toLowerCase() === 'k' ? 1_000 : (suffix ?? '').toLowerCase() === 'm' ? 1_000_000 : 1;
  return Math.round(digits * multiplier * 100);
}