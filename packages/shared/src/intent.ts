import type { Condition, ResultType } from './enums';

export interface Budget {
  amount: number; // minor units (kobo)
  currency: 'NGN';
  operator: '<=' | '>=' | '~';
}

export interface Timing {
  date: string | null;
  time: string | null;
  flexibility: 'flexible' | 'fixed';
}

export interface Audience {
  type: string;
  detail: string | null;
}

/** Structured output of the intent parser (Buildable PRD §6.1). */
export interface Intent {
  need: string;
  resultType: ResultType;
  categoryTag: string;
  condition: Condition | null;
  budget: Budget | null;
  location: { text: string | null } | null;
  timing: Timing | null;
  audience: Audience | null;
  subject: string | null;
  attributes: Record<string, string>;
  extras: string[];
  confidence: number;
  normalizedText: string;
}

export interface NeedRequest {
  id: string;
  userId: string;
  rawText: string;
  intent: Intent;
  status: NeedRequestStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export type NeedRequestStatus = import('./enums').NeedStatus;