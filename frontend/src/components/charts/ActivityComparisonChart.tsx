import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SegmentDistributionItem } from '../../types';

interface ActivityComparisonChartProps {
  data: SegmentDistributionItem[];
}

export const ActivityComparisonChart: React.FC<ActivityComparisonChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-stone-400">
        No viewing telemetry available.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.segment_name.split(' ')[0] + ' (' + item.segment_id + ')',
    fullName: item.segment_name,
    'Watch Time (hrs)': item.avg_watch_time,
    'Avg Session (mins)': item.avg_session_mins,
    'Completion (%)': item.avg_completion_rate,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const full = payload[0].payload.fullName;
      return (
        <div className="bg-stone-900 text-white text-xs p-3 rounded-lg shadow-lg border border-stone-800">
          <p className="font-bold text-stone-100 mb-2">{full}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-stone-400">{p.name}:</span>
              <span className="font-semibold" style={{ color: p.color }}>
                {p.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#78716c' }}
            axisLine={{ stroke: '#e7e5e4' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#78716c' }}
            axisLine={{ stroke: '#e7e5e4' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value: string) => (
              <span className="text-xs font-medium text-stone-600">{value}</span>
            )}
          />
          <Bar dataKey="Watch Time (hrs)" fill="#881337" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Avg Session (mins)" fill="#d97706" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Completion (%)" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
