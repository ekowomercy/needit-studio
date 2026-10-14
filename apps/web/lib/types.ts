import type { Intent, UserRole } from '@needit/shared';

export type ListingType = 'product' | 'service';
export type PriceType = 'fixed' | 'starting' | 'quote';
export type Condition = 'new' | 'used' | 'any';
export type VerificationStatus = 'unverified' | 'pending' | 'verified';

export interface MatchProvider {
  id: string;
  displayName: string | null;
  locationCity: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
  reviewCount: number;
  verificationStatus: VerificationStatus;
  areaRadiusKm: number;
  completedJobs: number;
  responseRate: number | null;
}

export interface MatchCandidate {
  id: string;
  title: string;
  description: string | null;
  listingType: ListingType;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  priceKobo: number | null;
  priceType: PriceType;
  condition: Condition | null;
  locationCity: string | null;
  createdAt: string;
  provider: MatchProvider;
}

export interface ScoredMatch {
  listing: MatchCandidate;
  score: number;
  breakdown: Record<string, number>;
  reasons: string[];
}

export interface MatchResult {
  intent: Intent;
  matches: ScoredMatch[];
  total: number;
}

export interface NeedRequest {
  id: string;
  userId: string;
  rawText: string;
  intent: Intent | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface CreateNeedResponse {
  need: NeedRequest;
  intent: Intent;
  matches: MatchResult;
}

export interface RefineNeedResponse {
  need: NeedRequest;
  intent: Intent;
  matches: MatchResult;
}

export interface PopularNeed {
  tag: string;
  count: number;
  sample: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  parentId: string | null;
}

export interface SessionUser {
  id: string;
  phone: string | null;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isProvider: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface AuthUser {
  id: string;
  phone: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isProvider: boolean;
  locationCity: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
  reviewCount: number;
  verificationStatus: VerificationStatus;
  providerProfile: ProviderProfile | null;
}

export interface ListingDetail {
  id: string;
  providerId: string;
  listingType: ListingType;
  title: string;
  description: string | null;
  priceKobo: number | null;
  priceType: PriceType;
  condition: Condition | null;
  images: string[] | null;
  categoryId: string | null;
  locationCity: string | null;
  status: string;
  createdAt: string;
  provider: AuthUser | null;
  providerProfile: ProviderProfile | null;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  areaCity: string | null;
  startingPriceKobo: number | null;
  responseRate: number | null;
  responseTimeMin: number | null;
  completedJobs: number;
  verificationStatus: VerificationStatus;
}

export interface ProviderListItem extends ProviderProfile {
  displayName: string | null;
  avatarUrl: string | null;
  ratingAvg: number;
  reviewCount: number;
  locationCity: string | null;
}

export interface ProviderDetail extends ProviderListItem {
  areaRadiusKm?: number | null;
  availability?: unknown;
}

export interface ProviderListing {
  id: string;
  providerId: string;
  listingType: ListingType;
  title: string;
  description: string | null;
  priceKobo: number | null;
  priceType: PriceType;
  images: string[] | null;
  locationCity: string | null;
  status: string;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  quality: number | null;
  communication: number | null;
  reliability: number | null;
  value: number | null;
  comment: string | null;
  createdAt: string;
  authorName: string | null;
  authorAvatar: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  refId: string | null;
  readAt: string | null;
  createdAt: string;
}


export interface ConversationParticipant {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  verificationStatus: VerificationStatus;
  isProvider: boolean;
}

export interface ConversationSummary {
  id: string;
  userId: string;
  providerId: string;
  needRequestId: string | null;
  updatedAt: string;
  other: ConversationParticipant | null;
  needText: string | null;
  unreadCount: number;
  lastMessage: {
    body: string | null;
    sentAt: string;
    senderId: string;
  } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  mediaUrls: string[] | null;
  sentAt: string;
  readAt: string | null;
}

export type BookingType = 'booking' | 'order' | 'request_fill';
export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Booking {
  id: string;
  userId: string;
  providerId: string;
  listingId: string | null;
  needRequestId: string | null;
  type: BookingType;
  status: BookingStatus;
  scheduledAt: string | null;
  quoteKobo: number | null;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  providerName: string | null;
  seekerName: string | null;
  listingTitle: string | null;
}
