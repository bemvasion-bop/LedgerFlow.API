import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'cyan' | 'green' | 'purple' | 'yellow' | 'red' | 'blue';
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'cyan',
  onClick,
  href,
  isActive = false
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
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const isClickable = onClick || href;

  return (
    <div 
      className={`
        bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 
        transition-all duration-300 min-w-0
        ${isActive 
          ? 'border-2 border-cyan-500/70 shadow-lg shadow-cyan-500/30 bg-gray-800/70' 
          : 'border border-gray-700/50'
        }
        ${isClickable ? 'cursor-pointer hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20' : 'hover:border-cyan-500/30'}
      `}
      onClick={handleClick}
    >
      {/* Layout: Icon + Title/Subtitle on LEFT, Value on RIGHT with MORE SPACING */}
      <div className="flex items-start justify-between gap-8">
        {/* Left Section: Icon + Title + Subtitle (Vertical Stack) */}
        <div className="flex gap-4 flex-1 min-w-0">
          <div className={`p-3 rounded-lg flex-shrink-0 ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-sm font-semibold text-white leading-tight mb-1">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-400 leading-tight">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section: KPI Value (Right-Aligned with MORE SPACING) */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-1 min-w-fit pl-4">
          <p className="text-2xl font-semibold text-white whitespace-nowrap">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
