/**
 * Company Types
 * Standardized company interfaces for the entire application
 */

export type SubscriptionStatus = 'Trial' | 'Active' | 'Expired' | 'Suspended';
export type CompanyStatus = 'Active' | 'Suspended' | 'Inactive';

export interface Plan {
  id: number;
  name: string;
  description: string;
  quarterlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxExpensesPerMonth: number;
  canUploadReceipt: boolean;
  hasAdvancedReports: boolean;
  hasAdvancedAnalytics: boolean;
  hasDepartmentAnalytics: boolean;
  hasRoleBasedWorkflows: boolean;  // ✅ CHANGED: Renamed from hasMultiLevelApprovals
  hasPrioritySupport: boolean;
  trialDays: number;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  planId: number;
  planName: string;
  billingCycle: string;
  subscriptionStatus: SubscriptionStatus;
  status: CompanyStatus;
  maxUsers?: number;
  trialEndsAt?: string;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
  userCount: number;
  expenseCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyDetail extends Company {
  expensesThisMonth: number;
}

export interface CompanyListItem {
  id: number;
  name: string;
  email: string;
  planName: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  subscriptionExpiresAt?: string;
  userCount: number;
  expenseCount?: number;
  createdAt: string;
}

export interface CreateCompanyRequest {
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  planId: number;
}

export interface UpdateCompanyRequest {
  companyId: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  planId?: number;
}

export interface ExtendTrialRequest {
  companyId: number;
  days: number;
}

export interface UpdatePlanRequest {
  companyId: number;
  planId: number;
}

export interface UpdateSubscriptionStatusRequest {
  companyId: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string;
}
