import api from './api';

// ✅ Export all types directly from this file
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

const baseUrl = 'department';

export const fetchDepartments = async (): Promise<Department[]> => {
  const response = await api.get<Department[]>(baseUrl);
  return response.data;
};

export const fetchDepartmentById = async (id: number): Promise<Department> => {
  const response = await api.get<Department>(`${baseUrl}/${id}`);
  return response.data;
};

export const createDepartment = async (payload: CreateDepartmentPayload): Promise<Department> => {
  const response = await api.post<Department>(baseUrl, payload);
  return response.data;
};

export const updateDepartment = async (id: number, payload: UpdateDepartmentPayload): Promise<Department> => {
  const response = await api.put<Department>(`${baseUrl}/${id}`, payload);
  return response.data;
};

export const deleteDepartment = async (id: number): Promise<void> => {
  await api.delete(`${baseUrl}/${id}`);
};
