/**
 * Subscription Types
 * Standardized subscription interfaces for the entire application
 */

import type { SubscriptionStatus } from './company';

export type BillingCycle = 'Quarterly' | 'Yearly';

export interface Subscription {
  id: number;
  companyId: number;
  companyName: string;
  planId: number;
  planName: string;
  subscriptionStatus: SubscriptionStatus;
  maxUsers: number;
  amount: number;
  billingCycle: BillingCycle;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStats {
  trialCount: number;
  activeCount: number;
  expiredCount: number;
  suspendedCount: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
}

export interface UpdateSubscriptionRequest {
  companyId: number;
  planId: number;
  subscriptionStatus: SubscriptionStatus;
  maxUsers: number;
  billingCycle: BillingCycle;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
}

export interface RenewSubscriptionRequest {
  companyId: number;
  months: number;
}

export interface ChangePlanRequest {
  companyId: number;
  newPlanId: number;
}
