import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color?: 'cyan' | 'green' | 'purple' | 'yellow' | 'red' | 'blue';
  href: string;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({
  title,
  subtitle,
  icon,
  color = 'cyan',
  href
}) => {
  const navigate = useNavigate();
  
  const colorClasses = {
    cyan: 'bg-cyan-500/10 text-cyan-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400'
  };

  const handleClick = () => {
    navigate(href);
  };

  return (
    <div 
      className="
        bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 
        transition-all duration-300 min-w-0
        cursor-pointer hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20
      "
      onClick={handleClick}
    >
      {/* Horizontal Layout: Icon + Text (Same as KpiCard) */}
      <div className="flex items-center gap-4">
        {/* Icon on LEFT */}
        <div className={`p-3 rounded-lg flex-shrink-0 ${colorClasses[color]}`}>
          {icon}
        </div>
        
        {/* Text on RIGHT */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white whitespace-nowrap">{title}</h3>
          <p className="text-xs text-slate-400 mt-1.5 whitespace-nowrap">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
