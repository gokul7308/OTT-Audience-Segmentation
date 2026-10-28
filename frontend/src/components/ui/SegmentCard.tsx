import React from 'react';
import { ArrowRight, Clock, Flame, PlayCircle, Calendar } from 'lucide-react';
import { SegmentDistributionItem } from '../../types';

interface SegmentCardProps {
  segment: SegmentDistributionItem;
  onClick: (segmentId: number) => void;
  accentIndex?: number;
}

export const SegmentCard: React.FC<SegmentCardProps> = ({
  segment,
  onClick,
  accentIndex = 0,
}) => {
  const accentColors = [
    { border: 'border-l-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
    { border: 'border-l-amber-600', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
    { border: 'border-l-purple-600', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
    { border: 'border-l-blue-600', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
    { border: 'border-l-emerald-600', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  ];

  const style = accentColors[accentIndex % accentColors.length];

  return (
    <div
      onClick={() => onClick(segment.segment_id)}
      className={`bg-white rounded-xl border border-stone-200 border-l-4 ${style.border} p-5 shadow-xs hover:shadow-sm hover:border-stone-300 transition-all cursor-pointer flex flex-col justify-between group`}
    >
      <div>
        {/* Header: Segment Badge & Percentage */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.badge}`}>
            Segment {segment.segment_id}
          </span>
          <div className="text-right">
            <span className="text-lg font-bold text-stone-900">{segment.percentage}%</span>
            <span className="text-xs text-stone-500 block font-normal leading-tight">
              {segment.count.toLocaleString()} viewers
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-stone-900 group-hover:text-brand-900 transition-colors leading-snug">
          {segment.segment_name}
        </h3>
        <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
          {segment.description}
        </p>

        {/* Dominant Genres */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {segment.recommended_genres.map((g) => (
            <span
              key={g}
              className="text-[11px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Behavioral Centroid Metrics Grid */}
      <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <div>
            <span className="text-stone-400 block text-[10px]">Avg Watch Time</span>
            <span className="font-semibold text-stone-800">{segment.avg_watch_time} hrs/mo</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PlayCircle className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <div>
            <span className="text-stone-400 block text-[10px]">Avg Session</span>
            <span className="font-semibold text-stone-800">{segment.avg_session_mins} mins</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <div>
            <span className="text-stone-400 block text-[10px]">Sessions / Wk</span>
            <span className="font-semibold text-stone-800">{segment.avg_sessions_per_week}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <div>
            <span className="text-stone-400 block text-[10px]">Completion</span>
            <span className="font-semibold text-stone-800">{segment.avg_completion_rate}%</span>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-4 pt-3 flex items-center justify-between text-xs font-semibold text-brand-900 group-hover:translate-x-0.5 transition-transform">
        <span>View Segmented Users</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
};
