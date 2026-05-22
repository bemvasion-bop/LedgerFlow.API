import React, { useState } from 'react';
import { RefreshCw, LogOut, Crown, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from './NotificationBell';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  showRefresh?: boolean;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  showRefresh = true,
  children
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadge = () => {
    if (user?.role === 'SuperAdmin') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-full">
          <Crown className="w-3 h-3 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400">Super Admin</span>
        </div>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
        {user?.role}
      </span>
    );
  };

  return (
    <div className="relative z-10 mb-8">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 rounded-2xl blur-3xl"></div>
      
      {/* Header Content */}
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-visible">
        {/* Left: Title Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-400 text-sm">{subtitle}</p>
          )}
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Custom Actions (if provided) */}
          {children}

          {/* Refresh Button */}
          {showRefresh && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative z-[9999]">
            <NotificationBell />
          </div>

          {/* Profile Dropdown */}
          <div className="relative z-[9998]">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 min-h-[42px]"
              aria-label="Profile Menu"
            >
              {/* Avatar Circle */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                {user?.role === 'SuperAdmin' ? (
                  <Crown className="w-4 h-4 text-white" />
                ) : (
                  <UserIcon className="w-4 h-4 text-white" />
                )}
              </div>

              {/* User Info - Hidden on mobile */}
              <div className="hidden md:flex flex-col items-start min-w-0">
                <span className="text-sm font-medium text-white truncate max-w-[120px]">
                  {user?.firstName || 'User'}
                </span>
                {getRoleBadge()}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-[9997]" 
                  onClick={() => setShowProfileMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-700/50 bg-gray-900/95 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[9998] animate-slideDown">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        {user?.role === 'SuperAdmin' ? (
                          <Crown className="w-5 h-5 text-white" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        {getRoleBadge()}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>

                  {/* Logout Button */}
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
