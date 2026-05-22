import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href: string;
  description?: string;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  title = 'Quick Actions',
  actions 
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.href)}
            className="block w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="text-cyan-400 group-hover:text-cyan-300 transition-colors">
                {action.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {action.label}
                </p>
                {action.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
