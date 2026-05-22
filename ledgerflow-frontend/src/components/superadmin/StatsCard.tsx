import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  subtitle?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'cyan',
  subtitle
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all">
      <div className="flex items-center justify-between">
        {/* Left Side: Icon + Title */}
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-${color}-500/10 rounded-lg flex-shrink-0`}>
            {icon}
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Right Side: Value + Trend */}
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <div className={`flex items-center justify-end gap-1 text-sm mt-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
