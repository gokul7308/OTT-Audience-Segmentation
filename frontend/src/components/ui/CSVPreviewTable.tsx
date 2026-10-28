import React from 'react';

interface CSVPreviewTableProps {
  rows: any[];
}

export const CSVPreviewTable: React.FC<CSVPreviewTableProps> = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
      <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
        <span className="font-bold text-stone-700">Preview (First {rows.length} rows)</span>
        <span className="text-stone-400">Validated against Streamly Telemetry Schema</span>
      </div>
      <div className="overflow-x-auto max-h-60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-semibold uppercase text-[10px]">
              <th className="py-2 px-3">Row</th>
              <th className="py-2 px-3">User ID</th>
              <th className="py-2 px-3 text-right">Watch Time</th>
              <th className="py-2 px-3 text-right">Avg Session</th>
              <th className="py-2 px-3 text-right">Sess/Wk</th>
              <th className="py-2 px-3 text-right">Completion</th>
              <th className="py-2 px-3 text-right">Weekend</th>
              <th className="py-2 px-3 text-right">Diversity</th>
              <th className="py-2 px-3">Top Genres</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-stone-50/50">
                <td className="py-2 px-3 font-mono text-[10px] text-stone-400">{r.row_index || i + 2}</td>
                <td className="py-2 px-3 font-bold font-mono text-stone-900">{r.user_id}</td>
                <td className="py-2 px-3 text-right font-medium">{r.watch_time_hours}h</td>
                <td className="py-2 px-3 text-right text-stone-600">{r.avg_session_mins}m</td>
                <td className="py-2 px-3 text-right text-stone-600">{r.sessions_per_week}</td>
                <td className="py-2 px-3 text-right font-medium">
                  {r.completion_rate !== null ? `${(r.completion_rate * 100).toFixed(0)}%` : 'Imputed'}
                </td>
                <td className="py-2 px-3 text-right text-stone-600">
                  {r.weekend_usage_ratio !== null ? `${(r.weekend_usage_ratio * 100).toFixed(0)}%` : '0.48'}
                </td>
                <td className="py-2 px-3 text-right text-stone-600">{r.genre_diversity}</td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {r.top_genres && r.top_genres.length > 0 ? (
                      r.top_genres.map((g: string) => (
                        <span key={g} className="text-[9px] bg-stone-100 px-1 py-0.2 rounded text-stone-600">
                          {g}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">None</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
