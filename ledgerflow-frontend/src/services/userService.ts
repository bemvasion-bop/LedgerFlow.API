import api from './api';

export interface RoleItem {
  id: number;
  roleName: string;
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  position?: string;
  roleId: number;
  roleName: string;
  departmentId?: number;
  departmentName?: string;
  isActive: boolean;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  position: string;
  password: string;
  roleId: number;
  departmentId?: number;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  password?: string;
  roleId?: number;
  departmentId?: number;
}

const baseUrl = 'admin/users';

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get<AdminUser[]>(baseUrl);
  return response.data;
};

export const fetchRoles = async (): Promise<RoleItem[]> => {
  const response = await api.get<RoleItem[]>(`${baseUrl}/roles`);
  return response.data;
};

export const createAdminUser = async (payload: CreateUserPayload) => {
  const response = await api.post<AdminUser>(baseUrl, payload);
  return response.data;
};

export const updateAdminUser = async (id: number, payload: UpdateUserPayload) => {
  const response = await api.put<AdminUser>(`${baseUrl}/${id}`, payload);
  return response.data;
};

export const deactivateAdminUser = async (id: number) => {
  await api.patch(`${baseUrl}/${id}/deactivate`);
};

export const activateAdminUser = async (id: number) => {
  await api.patch(`${baseUrl}/${id}/activate`);
};
