import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({ className = '', size = 36, showText = false, textClassName = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.png"
        alt="Ottor POS"
        className="rounded-xl object-contain shrink-0 shadow-sm transition-transform hover:scale-105"
        style={{ width: size, height: size }}
      />
      {showText && (
        <span className={`font-black tracking-tight text-slate-900 ${textClassName}`}>
          Ottor POS
        </span>
      )}
    </div>
  );
}
