import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'expense';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'default' }) => {
  // Return plain white text without any badge styling
  return (
    <span className="text-white text-sm font-medium">
      {status}
    </span>
  );
};
