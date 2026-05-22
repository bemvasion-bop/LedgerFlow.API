import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, Key, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ProfileDropdownProps {
  role: 'Admin' | 'SuperAdmin' | 'Finance' | 'Audit' | 'Employee';
  settingsPath?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ 
  role, 
  settingsPath 
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.href = '/login';
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'SuperAdmin':
        return 'Super Admin Account';
      case 'Admin':
        return 'Admin Account';
      case 'Finance':
        return 'Finance Manager Account';
      case 'Audit':
        return 'Auditor Account';
      case 'Employee':
        return 'Employee Account';
      default:
        return 'User Account';
    }
  };

  const getDefaultSettingsPath = () => {
    if (settingsPath) return settingsPath;
    
    switch (role) {
      case 'SuperAdmin':
        return '/superadmin/settings';
      case 'Admin':
        return '/admin/settings';
      case 'Finance':
        return '/finance/settings';
      case 'Audit':
        return '/audit/settings';
      case 'Employee':
        return '/employee/settings';
      default:
        return '/settings';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {profileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setProfileMenuOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl z-50">
            <div className="px-4 py-3 border-b border-gray-700/50">
              <p className="text-sm font-medium text-white">{user?.email || 'User'}</p>
              <p className="text-xs text-gray-400 mt-1">{getRoleLabel()}</p>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate(getDefaultSettingsPath());
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate(getDefaultSettingsPath());
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <div className="border-t border-gray-700/50 my-2"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
