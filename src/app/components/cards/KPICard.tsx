import { motion } from 'motion/react';
import { CountUp } from '../motion/CountUp';
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ title, value, prefix = '', suffix = '', decimals = 0, icon, trend }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-2 text-3xl font-semibold">
            <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} duration={0.8} />
          </div>
          {trend && (
            <div className={`mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}% from last month
            </div>
          )}
        </div>
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
