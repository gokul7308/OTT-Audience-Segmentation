import React from 'react';
import { Users2, ArrowRight, Lightbulb } from 'lucide-react';
import { AnalyticsOverview } from '../types';
import { SegmentCard } from '../components/ui/SegmentCard';
import { AudienceDistributionChart } from '../components/charts/AudienceDistributionChart';
import { EmptyState, LoadingSkeleton } from '../components/ui/FeedbackStates';

interface AudienceSegmentsPageProps {
  analytics: AnalyticsOverview | null;
  isLoading: boolean;
  onNavigateToUsers: (segmentId?: number) => void;
  onNavigateToImport: () => void;
}

export const AudienceSegmentsPage: React.FC<AudienceSegmentsPageProps> = ({
  analytics,
  isLoading,
  onNavigateToUsers,
  onNavigateToImport,
}) => {
  if (isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (!analytics || analytics.segment_distribution.length === 0) {
    return (
      <EmptyState
        title="No Segment Distribution Available"
        description="Process a batch of users through the K-Means clustering pipeline to view the five behavioral segments."
        actionText="Import Audience CSV"
        onAction={onNavigateToImport}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header Intro */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users2 className="w-5 h-5 text-brand-900" />
            <h2 className="text-base font-bold text-stone-900">Discovered Audience Clusters</h2>
          </div>
          <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">
            The unsupervised K-Means model (K=5) partitions viewing telemetry across watch time, session length, completion, weekend patterns, and genre affinities without manual labeling.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onNavigateToUsers()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-sm transition-colors"
          >
            <span>Explore All Viewer Lists</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {analytics.segment_distribution.map((seg, idx) => (
          <SegmentCard
            key={seg.segment_id}
            segment={seg}
            onClick={(id) => onNavigateToUsers(id)}
            accentIndex={idx}
          />
        ))}
      </div>

      {/* Distribution Breakdown & Strategy Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-stone-900 mb-1">Audience Share Breakdown</h3>
          <p className="text-xs text-stone-500 mb-4">Click any slice to filter viewers in User Explorer</p>
          <AudienceDistributionChart
            data={analytics.segment_distribution}
            onSelectSegment={(id) => onNavigateToUsers(id)}
          />
        </div>

        {/* Tailored Content Programming Strategies */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-900">Personalization & Programming Strategies</h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Transparent, explainable recommendation routing mapped directly to cluster centroid traits
            </p>
          </div>

          <div className="space-y-2.5">
            {analytics.segment_distribution.map((seg) => (
              <div
                key={seg.segment_id}
                className="p-3 rounded-lg border border-stone-100 bg-stone-50/70 hover:bg-stone-50 transition-colors flex items-start gap-3 text-xs"
              >
                <span className="font-bold font-mono text-[11px] text-brand-900 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded flex-shrink-0">
                  SEG {seg.segment_id}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-stone-900">{seg.segment_name}</span>
                  <p className="text-stone-600 text-[11px] mt-0.5 leading-relaxed">
                    {seg.recommendation_strategy || 'Surface high affinity catalog content matching cluster preferences.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 flex-shrink-0 max-w-[140px] justify-end">
                  {seg.recommended_genres.slice(0, 2).map((g) => (
                    <span key={g} className="text-[10px] bg-white border border-stone-200 px-1.5 py-0.5 rounded text-stone-700">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
