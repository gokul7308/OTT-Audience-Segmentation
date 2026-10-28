import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface GenreAffinityChartProps {
  genreDistribution: Record<string, number>;
}

export const GenreAffinityChart: React.FC<GenreAffinityChartProps> = ({ genreDistribution }) => {
  const chartData = Object.entries(genreDistribution || {})
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-stone-400">
        No genre affinity data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-stone-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-stone-800">
          <p className="font-bold text-stone-100">{d.genre}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-stone-400">Viewers with affinity:</span>
            <span className="font-semibold text-brand-300">{d.count.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={{ stroke: '#e7e5e4' }} />
          <YAxis
            type="category"
            dataKey="genre"
            tick={{ fontSize: 11, fill: '#44403c' }}
            axisLine={{ stroke: '#e7e5e4' }}
            width={85}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#4c1d95" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
