/**
 * User Types
 * Standardized user interfaces for the entire application
 */

export type UserRole = 'SuperAdmin' | 'Admin' | 'Employee' | 'Finance' | 'Audit';
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: UserRole;
  companyId: number;
  companyName?: string;
  departmentId?: number;
  departmentName?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserListItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleName: UserRole;
  companyName: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  companyId: number;
}

export interface UpdateUserRequest {
  userId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: number;
  isActive?: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: number;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    companyId: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// PLATFORM USER TYPES (Super Admin)
// ═══════════════════════════════════════════════════════════════════

export interface PlatformUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  roleId: number;
  roleName: string;
  companyId: number;
  companyName: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  companyId: number;
  isActive: boolean;
}

export interface UpdatePlatformUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: number;
  companyId?: number;
  isActive?: boolean;
}

export interface ResetPasswordRequest {
  userId: number;
  newPassword: string;
}
