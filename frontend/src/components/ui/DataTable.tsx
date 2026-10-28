import React from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { UserRecord } from '../../types';

interface DataTableProps {
  users: UserRecord[];
  totalUsers: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectUser: (user: UserRecord) => void;
  isLoading?: boolean;
}

const SEGMENT_BADGES: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  1: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  2: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  3: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  4: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
};

export const DataTable: React.FC<DataTableProps> = ({
  users,
  totalUsers,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onSelectUser,
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Audience Segment</th>
              <th className="py-3 px-3 text-right">Watch Time</th>
              <th className="py-3 px-3 text-right">Avg Session</th>
              <th className="py-3 px-3 text-right">Sess/Wk</th>
              <th className="py-3 px-3 text-right">Completion</th>
              <th className="py-3 px-3 text-right">Weekend</th>
              <th className="py-3 px-3 text-right">Diversity</th>
              <th className="py-3 px-4">Preferred Genres</th>
              <th className="py-3 px-3 text-right">Distance</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={11} className="py-3.5 px-4 bg-stone-50/40">
                    <div className="h-4 bg-stone-200/70 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-stone-400">
                  No viewer records found matching the active filters.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const badge = SEGMENT_BADGES[u.segment_id] || SEGMENT_BADGES[0];
                return (
                  <tr
                    key={u.user_id}
                    onClick={() => onSelectUser(u)}
                    className="hover:bg-stone-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-stone-900 group-hover:text-brand-900 font-mono text-[11px]">
                      {u.user_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border} whitespace-nowrap`}
                      >
                        {u.segment_name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-stone-900">
                      {u.watch_time_hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-3 text-right text-stone-600">
                      {u.avg_session_mins.toFixed(0)}m
                    </td>
                    <td className="py-3 px-3 text-right text-stone-600">
                      {u.sessions_per_week.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-stone-900">
                      {(u.completion_rate * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 text-right text-stone-600">
                      {(u.weekend_usage_ratio * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 text-right text-stone-600">
                      {u.genre_diversity.toFixed(1)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {u.top_genres && u.top_genres.length > 0 ? (
                          u.top_genres.map((g) => (
                            <span
                              key={g}
                              className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded"
                            >
                              {g}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-stone-500">
                      {u.distance_to_centroid.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(u);
                        }}
                        className="p-1 rounded text-stone-400 hover:text-brand-900 hover:bg-stone-100 transition-colors"
                        title="Inspect User Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-stone-50/50 border-t border-stone-200 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <span>
            Showing{' '}
            <strong className="text-stone-900 font-semibold">
              {totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-stone-900 font-semibold">
              {Math.min(currentPage * pageSize, totalUsers)}
            </strong>{' '}
            of <strong className="text-stone-900 font-semibold">{totalUsers.toLocaleString()}</strong> viewers
          </span>
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-xs text-stone-800 outline-none"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="p-1.5 rounded border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-semibold text-stone-800">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1.5 rounded border border-stone-200 hover:bg-white text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
