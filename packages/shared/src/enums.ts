export const UserRole = ['admin', 'seller', 'buyer'] as const;
export type UserRole = (typeof UserRole)[number];

export const ResultType = ['person', 'product', 'service', 'multiple'] as const;
export type ResultType = (typeof ResultType)[number];

export const NeedStatus = [
  'pending',
  'matched',
  'active',
  'booked',
  'completed',
  'closed',
  'expired',
] as const;
export type NeedStatus = (typeof NeedStatus)[number];

export const ListingStatus = ['draft', 'active', 'paused', 'sold', 'hidden'] as const;
export type ListingStatus = (typeof ListingStatus)[number];

export const BookingStatus = [
  'requested',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'refunded',
] as const;
export type BookingStatus = (typeof BookingStatus)[number];

export const ListingType = ['product', 'service'] as const;
export type ListingType = (typeof ListingType)[number];

export const PriceType = ['fixed', 'starting', 'quote'] as const;
export type PriceType = (typeof PriceType)[number];

export const Condition = ['new', 'used', 'any'] as const;
export type Condition = (typeof Condition)[number];

export const VerificationStatus = ['unverified', 'pending', 'verified'] as const;
export type VerificationStatus = (typeof VerificationStatus)[number];

export const ReportStatus = ['open', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof ReportStatus)[number];

export const ReportReason = [
  'fraud',
  'fake_product',
  'misleading_listing',
  'poor_conduct',
  'suspicious_account',
] as const;
export type ReportReason = (typeof ReportReason)[number];