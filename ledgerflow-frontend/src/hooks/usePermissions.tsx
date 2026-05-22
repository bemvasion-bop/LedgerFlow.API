import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

interface Permissions {
  planName: string | null;
  canApproveExpenses: boolean;
  canRejectExpenses: boolean;
  canProcessReimbursements: boolean;
  isStarterPlan: boolean;
  isBusinessPlan: boolean;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>({
    planName: null,
    canApproveExpenses: false,
    canRejectExpenses: false,
    canProcessReimbursements: false,
    isStarterPlan: false,
    isBusinessPlan: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/permissions/my-permissions');
        setPermissions(response.data);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        // Fallback to basic role-based permissions if API fails
        const isAdmin = user.role === 'Admin';
        const isFinance = user.role === 'Finance';
        const planName = user.planName || null;
        const isStarter = planName === 'Starter';
        const isBusiness = planName === 'Business';

        setPermissions({
          planName,
          canApproveExpenses: (isAdmin && isStarter) || (isFinance && isBusiness),
          canRejectExpenses: (isAdmin && isStarter) || (isFinance && isBusiness),
          canProcessReimbursements: (isAdmin && isStarter) || (isFinance && isBusiness),
          isStarterPlan: isStarter,
          isBusinessPlan: isBusiness,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  return { permissions, loading };
};
