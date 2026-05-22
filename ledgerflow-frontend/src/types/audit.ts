/**
 * Audit Log Types - Complete Definition
 */

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  userEmail?: string;
  companyId: number;
  companyName: string;
  action: string;
  entityType: string;
  entityId: string;
  entity?: string; // Alias for entityType for backward compatibility
  details: string;
  ipAddress: string;
  timestamp: string;
  createdAt?: string; // Alternative timestamp field
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  monthLogs: number;
  loginCount?: number;
  expenseCount?: number;
  expenseCreated?: number;
  expenseApproved?: number;
  expenseRejected?: number;
  expenseReimbursed?: number;
}

export interface AuditLogQuery {
  companyId?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
