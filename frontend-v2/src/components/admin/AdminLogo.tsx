import React from 'react';
import Image from 'next/image';

interface AdminLogoProps {
  variant?: 'sidebar' | 'header' | 'mobile' | 'footer';
  className?: string;
  src?: string;
  alt?: string;
}

const sizeMap: Record<NonNullable<AdminLogoProps['variant']>, string> = {
  sidebar: 'w-12 h-12 md:w-16 md:h-16',
  header: 'w-12 h-12 md:w-16 md:h-16',
  mobile: 'w-10 h-10',
  footer: 'w-12 h-12 md:w-16 md:h-16',
};

export function AdminLogo({
  variant = 'sidebar',
  className = '',
  src = '/logo-dark.svg',
  alt = 'CodeSkill',
}: AdminLogoProps) {
  const sizeClass = sizeMap[variant] || sizeMap.sidebar;
  return (
    <div className={`flex shrink-0 items-center justify-center ${sizeClass} ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={48}
        height={40}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
