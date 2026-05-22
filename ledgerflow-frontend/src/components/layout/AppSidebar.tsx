import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  BarChart3,
  PlusCircle,
  List,
  CreditCard,
  Crown
} from 'lucide-react';

interface PlanFeatures {
  planName: string;
  maxUsers: number;
  maxExpensesPerMonth: number;
  canUploadReceipt: boolean;
  hasAdvancedReports: boolean;
  hasAdvancedAnalytics: boolean;
  hasDepartmentAnalytics: boolean;
  hasRoleBasedWorkflows: boolean;  // ✅ CHANGED: Renamed from hasMultiLevelApprovals
  hasPrioritySupport: boolean;
}

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  
  // Get role from auth context (with fallback to localStorage)
  const role = user?.role || localStorage.getItem('role') || '';

  // Fetch plan features for Admin role
  useEffect(() => {
    const fetchPlanFeatures = async () => {
      if (role === 'Admin') {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const response = await axios.get('http://localhost:5256/api/plan/current', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Plan Features Loaded:', response.data);
          setPlanFeatures(response.data);
        } catch (error) {
          console.error('❌ Failed to fetch plan features:', error);
        }
      }
    };

    fetchPlanFeatures();
  }, [role]);

  // Role-based menu items
  const getMenuItems = (): MenuItem[] => {
    console.log('🔍 Building menu for role:', role);
    console.log('📊 Plan Features:', planFeatures);
    
    switch (role) {
      case 'SuperAdmin':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin/dashboard' },
          { icon: Building2, label: 'Companies', path: '/superadmin/companies' },
          { icon: Users, label: 'Platform Users', path: '/superadmin/users' },
          { icon: CreditCard, label: 'Subscriptions', path: '/superadmin/subscriptions' },
          { icon: FileText, label: 'Audit Logs', path: '/superadmin/audit-logs' },
          { icon: BarChart3, label: 'Reports', path: '/superadmin/reports' },
          { icon: Settings, label: 'Settings', path: '/superadmin/settings' },
        ];
      
      case 'Admin':
        const adminItems = [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: Users, label: 'User Management', path: '/admin/users' },
        ];

        console.log('🏢 Has Department Analytics:', planFeatures?.hasDepartmentAnalytics);
        console.log('🔄 Has Role Based Workflows:', planFeatures?.hasRoleBasedWorkflows);

        // Only show Departments if plan supports it (Business plan)
        if (planFeatures?.hasDepartmentAnalytics) {
          console.log('✅ Adding Departments to sidebar');
          adminItems.push({ icon: Building2, label: 'Departments', path: '/admin/departments' });
        } else {
          console.log('❌ Departments NOT added - hasDepartmentAnalytics is false');
        }

        adminItems.push({ icon: Wallet, label: 'All Expenses', path: '/admin/expenses' });

        // Show Reimbursements for Starter Plan Admins (they handle finance tasks)
        if (planFeatures?.planName === 'Starter') {
          console.log('✅ Adding Reimbursements to sidebar (Starter Plan)');
          adminItems.push({ icon: CreditCard, label: 'Reimbursements', path: '/admin/reimbursements' });
        } else {
          console.log('❌ Reimbursements NOT added - Business Plan (Finance handles this)');
        }

        // Reports & Insights (unified analytics center)
        adminItems.push({ icon: FileText, label: 'Reports', path: '/admin/reports' });

        // Audit Logs and Settings
        adminItems.push(
          { icon: FileText, label: 'Audit Logs', path: '/admin/audit' },
          { icon: Settings, label: 'Settings', path: '/admin/settings' }
        );

        console.log('📋 Final Admin Menu Items:', adminItems.map(i => i.label));
        return adminItems;
      
      case 'Finance':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/finance' },
          { icon: Clock, label: 'Pending Approvals', path: '/finance/pending' },
          { icon: CreditCard, label: 'Reimbursements', path: '/finance/reimbursements' },
          { icon: BarChart3, label: 'Financial Reports', path: '/finance/reports' },
        ];
      
      case 'Employee':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/employee' },
          { icon: List, label: 'My Expenses', path: '/employee/expenses' },
          { icon: CreditCard, label: 'Reimbursements', path: '/employee/reimbursements' },
        ];
      
      case 'Audit':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/audit' },
          { icon: Wallet, label: 'All Expenses', path: '/audit/expenses' },
          { icon: FileText, label: 'Audit Logs', path: '/audit/logs' },
          { icon: Shield, label: 'Compliance', path: '/audit/compliance' },
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    // Use the auth context logout function for proper cleanup
    await logout();
    // Clear any additional storage
    sessionStorage.clear();
    // Navigate to login and replace history to prevent back button
    navigate('/login', { replace: true });
    // Force reload to clear any cached state
    window.location.href = '/login';
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'SuperAdmin':
        return <Crown className="w-6 h-6 text-cyan-400" />;
      case 'Admin':
        return <Shield className="w-6 h-6 text-cyan-400" />;
      case 'Finance':
        return <Wallet className="w-6 h-6 text-cyan-400" />;
      case 'Employee':
        return <Users className="w-6 h-6 text-cyan-400" />;
      case 'Audit':
        return <FileText className="w-6 h-6 text-cyan-400" />;
      default:
        return <LayoutDashboard className="w-6 h-6 text-cyan-400" />;
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'SuperAdmin':
        return 'Super Admin';
      case 'Admin':
        return 'Administrator';
      case 'Finance':
        return 'Finance Manager';
      case 'Employee':
        return 'Employee';
      case 'Audit':
        return 'Auditor';
      default:
        return 'User';
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50 transition-all duration-300 z-50 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col border-b border-gray-700/50">
        {/* Toggle Button Row */}
        <div className="flex items-center justify-between p-4">
          {isOpen && (
            <div className="flex items-center gap-2">
              {getRoleIcon()}
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {getRoleLabel()}
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
          </button>
        </div>

        {/* Company & Plan Info - Only show for Admin with plan features */}
        {isOpen && role === 'Admin' && user && planFeatures && (
          <div className="px-4 pb-4 space-y-2">
            {/* Company Name */}
            {user.companyName && (
              <div className="text-sm">
                <div className="text-gray-500 text-xs mb-1">Company</div>
                <div className="text-white font-medium truncate">{user.companyName}</div>
              </div>
            )}
            
            {/* Plan Badge */}
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                planFeatures.planName === 'Business' 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400 border border-gray-500/30'
              }`}>
                {planFeatures.planName} Plan
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button - Hidden for Employee, Finance, Audit, SuperAdmin, and Admin roles */}
      {role !== 'Employee' && role !== 'Finance' && role !== 'Audit' && role !== 'SuperAdmin' && role !== 'Admin' && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      )}
    </aside>
  );
};
