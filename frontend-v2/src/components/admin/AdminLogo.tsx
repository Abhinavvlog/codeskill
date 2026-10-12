import React from 'react';
import Image from 'next/image';

interface AdminLogoProps {
  variant?: 'sidebar' | 'header' | 'login' | 'cu' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  src?: string;
  alt?: string;
}

export function CodeSkillShieldIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7F1D1D" />
          <stop offset="100%" stopColor="#450A0A" />
        </linearGradient>
      </defs>
      {/* Outer Hex Shield */}
      <polygon
        points="80,10 145,45 145,115 80,150 15,115 15,45"
        fill="#7F1D1D"
        stroke="#450A0A"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Inner subtle outline */}
      <polygon
        points="80,22 135,51 135,109 80,138 25,109 25,51"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
      />
      {/* Left Bracket < */}
      <path
        d="M60 62 L40 80 L60 98"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center Slash / (Yellow Accent) */}
      <path
        d="M87 54 L73 106"
        stroke="#FACC15"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Right Bracket > */}
      <path
        d="M100 62 L120 80 L100 98"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const sizeConfig = {
  sm: { box: 'w-9 h-9', title: 'text-base', badge: 'text-[9px] px-1.5 py-0.5', sub: 'text-[10px]' },
  md: { box: 'w-11 h-11', title: 'text-lg', badge: 'text-[10px] px-2 py-0.5', sub: 'text-[11px]' },
  lg: { box: 'w-13 h-13', title: 'text-xl', badge: 'text-xs px-2.5 py-0.5', sub: 'text-xs' },
  xl: { box: 'w-16 h-16', title: 'text-2xl', badge: 'text-xs px-3 py-1', sub: 'text-sm' },
};

export function AdminLogo({
  variant = 'sidebar',
  size = variant === 'header' || variant === 'sidebar' ? 'md' : 'lg',
  showText = false,
  showSubtitle = true,
  className = '',
  src,
  alt = 'CodeSkill',
}: AdminLogoProps) {
  const currentSize = sizeConfig[size] || sizeConfig.md;

  // If specific image like CU logo is requested
  if (variant === 'cu' || (src && (src.includes('cu-logo') || src.includes('chandigarh')))) {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${currentSize.box} ${className}`}>
        <Image
          src={src || '/cu-logo.png'}
          alt={alt}
          width={56}
          height={56}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    );
  }

  const iconElement = (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-xl bg-white border border-[#E5E7EB] shadow-xs p-1.5 transition-transform duration-200 hover:scale-105 ${currentSize.box}`}
    >
      <CodeSkillShieldIcon className="w-full h-full drop-shadow-xs" />
    </div>
  );

  if (!showText) {
    return <div className={`flex shrink-0 items-center justify-center ${className}`}>{iconElement}</div>;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {iconElement}
      <div className="min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`${currentSize.title} font-black tracking-tight text-[#1F2937] leading-none`}>
            Code<span className="text-[#7F1D1D]">Skill</span>
          </span>
          <span
            className={`${currentSize.badge} font-bold uppercase tracking-wider bg-[#7F1D1D]/10 text-[#7F1D1D] border border-[#7F1D1D]/20 rounded-md leading-none shadow-xs`}
          >
            Admin
          </span>
        </div>
        {showSubtitle && (
          <span className={`${currentSize.sub} font-semibold text-[#64748B] uppercase tracking-wider mt-1 truncate`}>
            Chandigarh University
          </span>
        )}
      </div>
    </div>
  );
}
