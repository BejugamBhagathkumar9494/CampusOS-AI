import React from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CampusOSLogoProps {
  size?: 'sm' | 'default' | 'lg';
  asLink?: boolean;
  to?: string;
  className?: string;
}

export const CampusOSLogo: React.FC<CampusOSLogoProps> = ({
  size = 'default',
  asLink = true,
  to = '/',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    default: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-lg',
    default: 'text-xl',
    lg: 'text-2xl',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    default: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-0.5',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Emblem */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center bg-gradient-to-br from-[#E85D24] to-[#F1733E] text-white shadow-md shadow-[#E85D24]/20 ring-1 ring-white/30 shrink-0 transition-transform duration-300 hover:scale-105`}
      >
        <GraduationCap className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D24] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFFCF7] border border-[#E85D24]"></span>
        </span>
      </div>

      {/* Typography */}
      <div className="flex items-center tracking-tight font-sans">
        <span className={`${textSizes[size]} font-bold text-[#142B43] tracking-tight`}>
          CampusOS
        </span>
        <span className={`${textSizes[size]} font-black text-[#E85D24] ml-1 tracking-tight`}>
          AI
        </span>
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D24] rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};

export default CampusOSLogo;
