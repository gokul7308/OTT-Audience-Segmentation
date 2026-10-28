import React from 'react';
import { X, Film, Activity, User, Target, Compass, Sparkles } from 'lucide-react';
import { UserRecord } from '../../types';

interface UserDetailDrawerProps {
  user: UserRecord | null;
  onClose: () => void;
}

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-200 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-brand-900 text-white flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 font-mono">{user.user_id}</h2>
                <span className="text-[10px] text-stone-500 font-normal">Viewer Telemetry & Personalization</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Predicted Segment Persona Box */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-900 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                  Segment {user.segment_id}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  Dist: <strong>{user.distance_to_centroid.toFixed(4)}</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900">{user.segment_name}</h3>
              {user.match_explanation && (
                <p className="text-xs text-stone-600 mt-2 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200/60">
                  {user.match_explanation}
                </p>
              )}
            </div>

            {/* Behavioral Telemetry Metrics */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                <Activity className="w-4 h-4 text-stone-400" />
                <span>Observed Telemetry</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-lg border border-stone-200 bg-white">
                  <span className="text-[10px] text-stone-500 block">Watch Time (Mo)</span>
                  <span className="text-sm font-bold text-stone-900">{user.watch_time_hours} hrs</span>
                </div>
                <div className="p-3 rounded-lg border border-stone-200 bg-white">
                  <span className="text-[10px] text-stone-500 block">Avg Session</span>
                  <span className="text-sm font-bold text-stone-900">{user.avg_session_mins} mins</span>
                </div>
                <div className="p-3 rounded-lg border border-stone-200 bg-white">
                  <span className="text-[10px] text-stone-500 block">Sessions / Week</span>
                  <span className="text-sm font-bold text-stone-900">{user.sessions_per_week}</span>
                </div>
                <div className="p-3 rounded-lg border border-stone-200 bg-white">
                  <span className="text-[10px] text-stone-500 block">Completion Rate</span>
                  <span className="text-sm font-bold text-stone-900">{(user.completion_rate * 100).toFixed(0)}%</span>
                </div>
                <div className="p-3 rounded-lg border border-stone-200 bg-white">
                  <span className="text-[10px] text-stone-500 block">Weekend Usage</span>
                  <span className="text-sm font-bold text-stone-900">{(user.weekend_usage_ratio * 100).toFixed(0)}%</span>
                </div>
                <div className="p-3 rounded-lg border border-stone-200 bg-white">
                  <span className="text-[10px] text-stone-500 block">Genre Diversity</span>
                  <span className="text-sm font-bold text-stone-900">{user.genre_diversity}</span>
                </div>
              </div>
            </div>

            {/* Preferred Genres */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                <Compass className="w-4 h-4 text-stone-400" />
                <span>Top Preferred Genres</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.top_genres && user.top_genres.length > 0 ? (
                  user.top_genres.map((g) => (
                    <span
                      key={g}
                      className="text-xs font-medium bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md border border-stone-200"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400 italic">No declared preferred genres</span>
                )}
              </div>
            </div>

            {/* Recommended Catalog Titles */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                <Sparkles className="w-4 h-4 text-brand-700" />
                <span>Tailored Catalog Recommendations</span>
              </div>
              <div className="space-y-2">
                {user.recommendations && user.recommendations.length > 0 ? (
                  user.recommendations.map((title, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded bg-brand-100 text-brand-900 flex items-center justify-center flex-shrink-0">
                        <Film className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate">{title}</h4>
                        <span className="text-[10px] text-stone-500">Personalized Match</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-stone-400 italic p-3 text-center border border-dashed border-stone-200 rounded-lg">
                    No recommendations generated.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
