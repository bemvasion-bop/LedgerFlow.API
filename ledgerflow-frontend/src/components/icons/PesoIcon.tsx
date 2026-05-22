import React from 'react';

interface PesoIconProps {
  className?: string;
  size?: number;
}

export const PesoIcon: React.FC<PesoIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* P shape */}
      <path d="M6 4v16" />
      <path d="M6 4h6a4 4 0 0 1 0 8H6" />
      {/* Horizontal lines */}
      <line x1="3" y1="9" x2="13" y2="9" />
      <line x1="3" y1="13" x2="10" y2="13" />
    </svg>
  );
};
