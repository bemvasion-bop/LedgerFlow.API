import apiClient from './api.config';
import type {
  SystemStats,
  Company,
  CompanyDetail,
  PlatformActivity,
  CompanyGrowth,
  AuditLog,
  Plan,
  ExtendTrialRequest,
  UpdatePlanRequest,
  PaginatedResponse,
  AuditLogQuery,
  PlatformUser,
  CreatePlatformUserRequest,
  UpdatePlatformUserRequest,
  ResetPasswordRequest,
  Subscription,
  SubscriptionStats,
  UpdateSubscriptionRequest,
  RenewSubscriptionRequest,
  ChangePlanRequest
} from '../types';

// Super Admin Service
class SuperAdminService {
  private readonly basePath = '/SuperAdmin';

  // Dashboard Statistics
  async getSystemStats(): Promise<SystemStats> {
    const response = await apiClient.get<SystemStats>(`${this.basePath}/stats`);
    return response.data;
  }

  // Company Management
  async getAllCompanies(): Promise<Company[]> {
    const response = await apiClient.get<Company[]>(`${this.basePath}/companies`);
    return response.data;
  }

  async getCompanyDetail(companyId: number): Promise<CompanyDetail> {
    const response = await apiClient.get<CompanyDetail>(`${this.basePath}/companies/${companyId}`);
    return response.data;
  }

  async suspendCompany(companyId: number): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.basePath}/companies/${companyId}/suspend`);
    return response.data;
  }

  async activateCompany(companyId: number): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.basePath}/companies/${companyId}/activate`);
    return response.data;
  }

  async extendTrial(data: ExtendTrialRequest): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.basePath}/companies/extend-trial`, data);
    return response.data;
  }

  async updateCompanyPlan(data: UpdatePlanRequest): Promise<{ message: string }> {
    const response = await apiClient.put(`${this.basePath}/companies/plan`, data);
    return response.data;
  }

  async createCompany(data: {
    name: string;
    email: string;
    contactPerson: string;
    planId: number;
    subscriptionStatus: string;
    maxUsers: number;
  }): Promise<Company> {
    const response = await apiClient.post<Company>(`${this.basePath}/companies`, data);
    return response.data;
  }

  async createCompanyWithAdmin(data: {
    companyName: string;
    companyEmail: string;
    companyPhone?: string;
    companyAddress?: string;
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPassword: string;
    planId: number;
    subscriptionStatus: string;
  }): Promise<{ success: boolean; message: string; company: CompanyDetail }> {
    const response = await apiClient.post(`${this.basePath}/companies/with-admin`, data);
    return response.data;
  }

  async updateCompany(companyId: number, data: {
    name: string;
    email: string;
    contactPerson: string;
    planId: number;
    subscriptionStatus: string;
    maxUsers: number;
  }): Promise<Company> {
    const response = await apiClient.put<Company>(`${this.basePath}/companies/${companyId}`, data);
    return response.data;
  }

  async updateCompanyWithAdmin(companyId: number, data: {
    companyName?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyAddress?: string;
    adminFirstName?: string;
    adminLastName?: string;
    adminEmail?: string;
    adminPassword?: string;
    planId?: number;
    subscriptionStatus?: string;
  }): Promise<{ success: boolean; message: string; company: CompanyDetail }> {
    const response = await apiClient.put(`${this.basePath}/companies/${companyId}/with-admin`, data);
    return response.data;
  }

  async deleteCompany(companyId: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`${this.basePath}/companies/${companyId}`);
    return response.data;
  }

  // Analytics
  async getPlatformActivity(days: number = 30): Promise<PlatformActivity[]> {
    const response = await apiClient.get<PlatformActivity[]>(
      `${this.basePath}/analytics/activity?days=${days}`
    );
    return response.data;
  }

  async getCompanyGrowth(months: number = 6): Promise<CompanyGrowth[]> {
    const response = await apiClient.get<CompanyGrowth[]>(
      `${this.basePath}/analytics/growth?months=${months}`
    );
    return response.data;
  }

  // Audit Logs
  async getAuditLogs(params?: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`${this.basePath}/audit-logs?${queryParams.toString()}`);
    return response.data;
  }

  // Plans
  async getAllPlans(): Promise<Plan[]> {
    const response = await apiClient.get<Plan[]>(`${this.basePath}/plans`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PLATFORM USERS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  async getAllPlatformUsers(): Promise<PlatformUser[]> {
    const response = await apiClient.get<PlatformUser[]>(`${this.basePath}/users`);
    return response.data;
  }

  async getPlatformUser(userId: number): Promise<PlatformUser> {
    const response = await apiClient.get<PlatformUser>(`${this.basePath}/users/${userId}`);
    return response.data;
  }

  async createPlatformUser(data: CreatePlatformUserRequest): Promise<{ success: boolean; message: string; data: PlatformUser }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: PlatformUser }>(`${this.basePath}/users`, data);
    return response.data;
  }

  async updatePlatformUser(userId: number, data: UpdatePlatformUserRequest): Promise<{ success: boolean; message: string; data: PlatformUser }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: PlatformUser }>(`${this.basePath}/users/${userId}`, data);
    return response.data;
  }

  async deletePlatformUser(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`${this.basePath}/users/${userId}`);
    return response.data;
  }

  async activateUser(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`${this.basePath}/users/${userId}/activate`);
    return response.data;
  }

  async suspendUser(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`${this.basePath}/users/${userId}/suspend`);
    return response.data;
  }

  async resetUserPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`${this.basePath}/users/reset-password`, data);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUBSCRIPTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  async getAllSubscriptions(): Promise<Subscription[]> {
    const response = await apiClient.get<Subscription[]>(`${this.basePath}/subscriptions`);
    return response.data;
  }

  async getSubscriptionStats(): Promise<SubscriptionStats> {
    const response = await apiClient.get<SubscriptionStats>(`${this.basePath}/subscriptions/stats`);
    return response.data;
  }

  async getSubscription(companyId: number): Promise<Subscription> {
    const response = await apiClient.get<Subscription>(`${this.basePath}/subscriptions/${companyId}`);
    return response.data;
  }

  async updateSubscription(companyId: number, data: UpdateSubscriptionRequest): Promise<Subscription> {
    const response = await apiClient.put<Subscription>(`${this.basePath}/subscriptions/${companyId}`, data);
    return response.data;
  }

  async renewSubscription(data: RenewSubscriptionRequest): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.basePath}/subscriptions/renew`, data);
    return response.data;
  }

  async changePlan(data: ChangePlanRequest): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.basePath}/subscriptions/change-plan`, data);
    return response.data;
  }

  async activateSubscription(companyId: number): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.basePath}/subscriptions/${companyId}/activate`);
    return response.data;
  }

  async suspendSubscription(companyId: number): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.basePath}/subscriptions/${companyId}/suspend`);
    return response.data;
  }
}

export const superAdminService = new SuperAdminService();
