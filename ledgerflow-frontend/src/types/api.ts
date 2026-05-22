/**
 * API Response Types
 */

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SystemStats {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  expiredCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  totalExpenses: number;
  starterPlanCompanies: number;
  businessPlanCompanies: number;
}

export interface PlatformActivity {
  date: string;
  companyRegistrations: number;
  userRegistrations: number;
  expenseSubmissions: number;
}

export interface CompanyGrowth {
  month: string;
  companiesRegistered: number;
  totalCompanies: number;
}
