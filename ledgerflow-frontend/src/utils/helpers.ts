// Utility functions

export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '—';
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '—';
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#f39c12';
    case 'approved':
      return '#27ae60';
    case 'rejected':
      return '#e74c3c';
    case 'reimbursed':
      return '#9b59b6';
    default:
      return '#95a5a6';
  }
};

export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'Admin':
      return 'Administrator';
    case 'Employee':
      return 'Employee';
    case 'Finance':
      return 'Finance Manager';
    case 'Auditor':
      return 'Auditor';
    default:
      return role;
  }
};