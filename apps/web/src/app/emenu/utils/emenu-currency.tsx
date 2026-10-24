import React from 'react';

export type EmenuCurrencyMode = 'USD' | 'KHR' | 'BOTH';

export function formatEmenuPriceValues(
  price: number | string,
  exchangeRate: number = 4100
): { usd: string; khr: string } {
  const num = Number(price) || 0;
  return {
    usd: `$${num.toFixed(2)}`,
    khr: `${Math.round(num * exchangeRate).toLocaleString()} ៛`,
  };
}

export interface EMenuPriceProps {
  price: number | string;
  exchangeRate?: number;
  currencyMode?: EmenuCurrencyMode;
  className?: string;
  usdClassName?: string;
  khrClassName?: string;
  layout?: 'col' | 'row' | 'inline';
  align?: 'left' | 'right' | 'center';
}

export function EMenuPrice({
  price,
  exchangeRate = 4100,
  currencyMode = 'BOTH',
  className = '',
  usdClassName = '',
  khrClassName = '',
  layout = 'col',
  align = 'right'
}: EMenuPriceProps) {
  const { usd, khr } = formatEmenuPriceValues(price, exchangeRate);
  const alignClass = align === 'left' ? 'items-start text-left' : align === 'center' ? 'items-center text-center' : 'items-end text-right';

  if (currencyMode === 'KHR') {
    return (
      <div className={`flex flex-col ${alignClass} leading-tight ${className}`}>
        <span className={`font-black tracking-tight ${khrClassName}`}>{khr}</span>
        <span className={`text-[11px] font-bold opacity-60 ${usdClassName}`}>{usd}</span>
      </div>
    );
  }

  if (currencyMode === 'USD') {
    return (
      <div className={`flex flex-col ${alignClass} leading-tight ${className}`}>
        <span className={`font-black tracking-tight ${usdClassName}`}>{usd}</span>
        <span className={`text-[11px] font-bold opacity-60 ${khrClassName}`}>{khr}</span>
      </div>
    );
  }

  // BOTH mode
  if (layout === 'inline') {
    return (
      <span className={`inline-flex items-baseline gap-1.5 font-bold ${className}`}>
        <span className={usdClassName}>{usd}</span>
        <span className="opacity-40 text-xs">•</span>
        <span className={`text-xs ${khrClassName}`}>{khr}</span>
      </span>
    );
  }

  if (layout === 'row') {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <span className={`font-black ${usdClassName}`}>{usd}</span>
        <span className={`text-xs font-bold opacity-75 ${khrClassName}`}>({khr})</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${alignClass} leading-tight ${className}`}>
      <span className={`font-black tracking-tight ${usdClassName}`}>{usd}</span>
      <span className={`text-xs font-bold opacity-75 ${khrClassName}`}>{khr}</span>
    </div>
  );
}
