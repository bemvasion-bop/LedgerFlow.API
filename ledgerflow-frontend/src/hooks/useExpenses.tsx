import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Expense {
  id: number;
  userId: number;
  amount: number;
  description: string;
  category: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  reimbursedAt?: string;
  rejectionReason?: string;
  receipts: Receipt[];
}

interface Receipt {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  pending: number;
  approved: number;
  rejected: number;
  reimbursed: number;
  byCategory: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async (filters?: {
    category?: string;
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.pageNumber) params.append('pageNumber', filters.pageNumber.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

      const response = await api.get('/expenses', {
        params: {
          category: filters?.category,
          status: filters?.status,
          pageNumber: filters?.pageNumber,
          pageSize: filters?.pageSize
        }
      });
      setExpenses(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/expenses/history/stats');
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData: {
    amount: number;
    description: string;
    category: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/expenses', expenseData);
      setExpenses(prev => [response.data, ...prev]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: number, expenseData: {
    amount: number;
    description: string;
    category: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/expenses/${id}`, expenseData);
      setExpenses(prev => prev.map(exp => exp.id === id ? response.data : exp));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveExpense = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/expenses/${id}/approve`);
      setExpenses(prev => prev.map(exp => exp.id === id ? response.data : exp));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectExpense = async (id: number, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/expenses/${id}/reject`, { rejectionReason: reason });
      setExpenses(prev => prev.map(exp => exp.id === id ? response.data : exp));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reimburseExpense = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/expenses/${id}/reimburse`);
      setExpenses(prev => prev.map(exp => exp.id === id ? response.data : exp));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reimburse expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    expenses,
    stats,
    loading,
    error,
    fetchExpenses,
    fetchExpenseStats,
    createExpense,
    updateExpense,
    approveExpense,
    rejectExpense,
    reimburseExpense
  };
};