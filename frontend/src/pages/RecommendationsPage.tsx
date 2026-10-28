import React, { useState } from 'react';
import { Sparkles, Film, Compass, User, RefreshCw, Layers } from 'lucide-react';
import { api } from '../api/client';
import { UserRecord } from '../types';

interface RecommendationsPageProps {
  initialUsers?: UserRecord[];
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ initialUsers = [] }) => {
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(
    initialUsers.length > 0 ? initialUsers[0] : null
  );

  // Custom interactive simulation state
  const [customUserId, setCustomUserId] = useState('USR-TEST-01');
  const [watchTime, setWatchTime] = useState(35.0);
  const [sessionMins, setSessionMins] = useState(75.0);
  const [completionRate, setCompletionRate] = useState(0.85);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Action', 'Thriller', 'Sci-Fi']);
  const [simulatedResult, setSimulatedResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const allGenres = [
    'Action',
    'Animation',
    'Comedy',
    'Documentary',
    'Drama',
    'Family',
    'Romance',
    'Sci-Fi',
    'Thriller',
  ];

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await api.getSingleRecommendation({
        user_id: customUserId,
        watch_time_hours: watchTime,
        avg_session_mins: sessionMins,
        completion_rate: completionRate,
        top_genres: selectedGenres,
        genre_diversity: selectedGenres.length,
      });
      setSimulatedResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const activeProfile = simulatedResult || selectedUser;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-brand-900" />
            <h2 className="text-base font-bold text-stone-900">Personalized Content Recommendations</h2>
          </div>
          <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">
            Transparent, rule-based recommendation engine prioritizing intersection of user affinities and cluster centroid traits from the Streamly catalog.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Telemetry Tester / User Picker */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900">Viewer Profile Parameters</h3>
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Telemetry</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">User Identifier</label>
              <input
                type="text"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-900 text-xs font-mono focus:border-brand-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Watch Time (hrs/mo)</label>
                <input
                  type="number"
                  step="0.5"
                  value={watchTime}
                  onChange={(e) => setWatchTime(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-900 text-xs focus:border-brand-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Avg Session (mins)</label>
                <input
                  type="number"
                  step="1"
                  value={sessionMins}
                  onChange={(e) => setSessionMins(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-900 text-xs focus:border-brand-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Completion Rate: {(completionRate * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={completionRate}
                onChange={(e) => setCompletionRate(Number(e.target.value))}
                className="w-full accent-brand-900"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-2">Preferred Genres (Multi-Select):</label>
              <div className="flex flex-wrap gap-1.5">
                {allGenres.map((g) => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                        isSelected
                          ? 'bg-brand-900 text-white border-brand-900 font-semibold shadow-2xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full mt-2 py-2.5 px-4 bg-brand-900 hover:bg-brand-950 text-white rounded-lg font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Scoring Profile...' : 'Score Profile & Get Recommendations'}</span>
            </button>
          </div>
        </div>

        {/* Right: Personalization Recommendations & Explainability */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-stone-900">Tailored Content Matches</h3>
              {activeProfile && (
                <span className="text-xs font-bold text-brand-900 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                  Segment {activeProfile.segment_id}
                </span>
              )}
            </div>

            {activeProfile ? (
              <div className="space-y-4">
                {/* Segment Persona Card */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-stone-900">{activeProfile.segment_name}</span>
                    <span className="text-xs text-stone-500 font-mono">
                      Distance to Centroid: <strong>{activeProfile.distance_to_centroid.toFixed(4)}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed mt-1">
                    Rule-based matching maps viewer telemetry into high-confidence catalog items by intersecting user genre preferences with cluster recommendations.
                  </p>
                </div>

                {/* Recommended Titles Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-stone-400" />
                    <span>Catalog Titles Recommended ({activeProfile.recommendations?.length || 0})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeProfile.recommendations || []).map((title: string, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-brand-300 transition-all shadow-2xs group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-bold text-xs text-stone-900 group-hover:text-brand-900 transition-colors">
                            {title}
                          </h5>
                          <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded">
                            Match #{i + 1}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 mt-2 block">Streamly High-Affinity Catalog</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-stone-400 text-xs">
                Select or score a profile to inspect personalized catalog titles.
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-stone-50 text-[11px] text-stone-500 border border-stone-200">
            <strong>Explainability Notice:</strong> Recommendations are calculated deterministically using the platform's catalog rule engine, ensuring zero hallucinations and full reproducibility across deployments.
          </div>
        </div>
      </div>
    </div>
  );
};
