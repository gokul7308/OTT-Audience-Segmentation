import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SegmentDistributionItem } from '../../types';

interface AudienceDistributionChartProps {
  data: SegmentDistributionItem[];
  onSelectSegment?: (segmentId: number) => void;
}

const COLORS = ['#881337', '#d97706', '#7e22ce', '#2563eb', '#059669'];

export const AudienceDistributionChart: React.FC<AudienceDistributionChartProps> = ({
  data,
  onSelectSegment,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-stone-400">
        No audience segmentation data available.
      </div>
    );
  }

  const chartData = data.map((item, idx) => ({
    name: item.segment_name,
    shortName: `S${item.segment_id}`,
    segment_id: item.segment_id,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[idx % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-stone-900 text-white text-xs p-3 rounded-lg shadow-lg border border-stone-800">
          <p className="font-bold text-stone-100">{d.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-stone-400">Viewers:</span>
            <span className="font-semibold text-white">{d.value.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Audience Share:</span>
            <span className="font-semibold text-brand-300">{d.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            onClick={(entry) => onSelectSegment && onSelectSegment(entry.segment_id)}
            cursor="pointer"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-xs font-medium text-stone-600 truncate max-w-[200px] inline-block">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
