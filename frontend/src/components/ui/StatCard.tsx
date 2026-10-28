import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'neutral';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}) => {
  const badgeClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-brand-50 text-brand-700 border-brand-200',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
  }[badge?.variant || 'neutral'];

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2.5">
        <span className="text-2xl font-bold text-stone-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <span className="text-xs text-stone-500 mt-2 font-normal">
          {subtitle}
        </span>
      )}
    </div>
  );
};
