/**
 * Expense Types - Complete Definition
 */

export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
export type ExpenseCategory = 'Travel' | 'Food' | 'Office' | 'Equipment' | 'Other';

export interface Expense {
  id: number;
  userId: number;
  userName: string;
  companyId: number;
  amount: number;
  category: string;
  description: string;
  receiptUrl?: string;
  receipts?: Receipt[]; // Array of receipt attachments
  status: ExpenseStatus;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  reimbursedAt?: string;
  approvedBy?: number;
  approverName?: string;
  rejectionReason?: string;
  createdAt?: string; // Alternative to submittedAt
}

export interface Receipt {
  id?: number;
  fileUrl: string;
  fileName: string;
  uploadedAt?: string;
}

export interface ApprovalHistory {
  id: number;
  expenseId: number;
  expenseDescription?: string; // Description of the expense
  expenseAmount?: number; // Amount of the expense
  approverId: number;
  approverName: string;
  approverEmail?: string;
  action: 'Approved' | 'Rejected';
  status?: 'Approved' | 'Rejected'; // Alias for action
  comments?: string;
  remarks?: string; // Alternative to comments
  timestamp: string;
  createdAt?: string; // Alternative to timestamp
}

export interface CreateExpenseRequest {
  amount: number;
  category: string;
  description: string;
  receiptUrl?: string;
}

export interface ApproveExpenseRequest {
  expenseId: number;
  comments?: string;
}

export interface RejectExpenseRequest {
  expenseId: number;
  reason: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
  reimbursedExpenses: number;
  totalAmount: number;
}
