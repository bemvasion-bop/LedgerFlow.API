/**
 * Department Types
 * Types for department management in Business plan companies
 */

export interface Department {
  id: number;
  name: string;
  description?: string;
  companyId: number;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}
