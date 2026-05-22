import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl';
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  maxWidth = 'full',
  title,
  subtitle,
  icon: Icon
}) => {
  const maxWidthClasses = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl'
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto space-y-8`}>
      {title && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon className="w-6 h-6 text-cyan-400" />}
            <h1 className="text-3xl font-bold text-white">{title}</h1>
          </div>
          {subtitle && <p className="text-slate-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
