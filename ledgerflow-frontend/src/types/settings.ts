/**
 * Settings Types
 * User profile, preferences, and security settings
 */

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleName: string;
  companyName: string;
  companyId: number;
  roleId: number;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  currency: string;
  timezone: string;
  dateFormat: string;
  emailNotifications: boolean;
  approvalAlerts: boolean;
  expenseAlerts: boolean;
  securityAlerts: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
