import api from './api';

export interface PlatformOverview {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  expiredCompanies: number;
  totalUsers: number;
  totalExpenses: number;
  totalExpenseAmount: number;
  activeSessions: number;
}

export interface CompanyGrowthDataPoint {
  month: string;
  count: number;
}

export interface UserActivityDataPoint {
  date: string;
  loginCount: number;
  uniqueUsers: number;
}

export interface SubscriptionDistribution {
  status: string;
  count: number;
}

export interface ExpenseByCompany {
  companyName: string;
  totalExpenses: number;
  totalAmount: number;
}

export interface ExpenseByCategory {
  category: string;
  count: number;
  totalAmount: number;
}

export interface TopCompany {
  id: number;
  name: string;
  userCount: number;
  expenseCount: number;
  totalExpenseAmount: number;
  planName: string;
  status: string;
}

export interface MostActiveUser {
  userId: number;
  userName: string;
  email: string;
  companyName: string;
  roleName: string;
  activityCount: number;
  lastActivity: string;
}

export interface RecentActivity {
  id: number;
  timestamp: string;
  companyName: string;
  userName: string;
  action: string;
  details: string;
}

export interface SystemHealth {
  totalUsers: number;
  activeUsers: number;
  userHealthPercentage: number;
  totalCompanies: number;
  activeCompanies: number;
  companyHealthPercentage: number;
  todayLogins: number;
  todayExpenses: number;
  databaseStatus: string;
  apiStatus: string;
}

export const reportsService = {
  async getPlatformOverview(): Promise<PlatformOverview> {
    const response = await api.get('/superadmin/reports/overview');
    return response.data;
  },

  async getCompanyGrowth(months: number = 6): Promise<CompanyGrowthDataPoint[]> {
    const response = await api.get(`/superadmin/reports/company-growth?months=${months}`);
    return response.data;
  },

  async getUserActivity(days: number = 30): Promise<UserActivityDataPoint[]> {
    const response = await api.get(`/superadmin/reports/user-activity?days=${days}`);
    return response.data;
  },

  async getSubscriptionDistribution(): Promise<SubscriptionDistribution[]> {
    const response = await api.get('/superadmin/reports/subscription-distribution');
    return response.data;
  },

  async getExpensesByCompany(topN: number = 10): Promise<ExpenseByCompany[]> {
    const response = await api.get(`/superadmin/reports/expenses-by-company?topN=${topN}`);
    return response.data;
  },

  async getExpensesByCategory(): Promise<ExpenseByCategory[]> {
    const response = await api.get('/superadmin/reports/expenses-by-category');
    return response.data;
  },

  async getTopCompanies(topN: number = 10): Promise<TopCompany[]> {
    const response = await api.get(`/superadmin/reports/top-companies?topN=${topN}`);
    return response.data;
  },

  async getMostActiveUsers(topN: number = 10): Promise<MostActiveUser[]> {
    const response = await api.get(`/superadmin/reports/most-active-users?topN=${topN}`);
    return response.data;
  },

  async getRecentActivities(count: number = 20): Promise<RecentActivity[]> {
    const response = await api.get(`/superadmin/reports/recent-activities?count=${count}`);
    return response.data;
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get('/superadmin/reports/system-health');
    return response.data;
  },
};
