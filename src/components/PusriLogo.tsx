import React from 'react';

interface PusriLogoProps {
  className?: string;
  size?: number | string;
  withBg?: boolean;
}

export const PusriLogo: React.FC<PusriLogoProps> = ({ 
  className = 'h-10 w-auto', 
  size,
  withBg = true
}) => {
  const content = (
    <img
      src="/logo-pusri.png"
      alt="Logo Resmi PT Pupuk Sriwidjaja Palembang"
      className="h-full w-auto max-h-full max-w-full object-contain block select-none"
      loading="eager"
      decoding="sync"
    />
  );

  if (withBg) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 bg-white p-1 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-700/60 select-none ${className}`}
        style={size ? { height: size, width: typeof size === 'number' ? `${size * 0.9}px` : size } : undefined}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={size ? { height: size, width: typeof size === 'number' ? `${size * 0.9}px` : size } : undefined}
    >
      {content}
    </div>
  );
};
