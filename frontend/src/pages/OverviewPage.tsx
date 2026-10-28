import React from 'react';
import {
  Users,
  PieChart as PieIcon,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { AnalyticsOverview } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { SegmentCard } from '../components/ui/SegmentCard';
import { AudienceDistributionChart } from '../components/charts/AudienceDistributionChart';
import { ActivityComparisonChart } from '../components/charts/ActivityComparisonChart';
import { GenreAffinityChart } from '../components/charts/GenreAffinityChart';
import { EmptyState, LoadingSkeleton } from '../components/ui/FeedbackStates';
import { ExportMenu } from '../components/ui/ExportMenu';

interface OverviewPageProps {
  analytics: AnalyticsOverview | null;
  isLoading: boolean;
  onNavigateToUsers: (segmentId?: number) => void;
  onNavigateToImport: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  analytics,
  isLoading,
  onNavigateToUsers,
  onNavigateToImport,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-stone-200 animate-pulse" />
          ))}
        </div>
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  if (!analytics || analytics.total_users_analyzed === 0) {
    return (
      <EmptyState
        title="No Audience Telemetry Loaded"
        description="Upload an audience activity CSV or initialize the baseline dataset to discover behavioral clusters and inspect recommendations."
        actionText="Import Audience CSV"
        onAction={onNavigateToImport}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Batch Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-stone-200/90 rounded-xl px-5 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 text-brand-900 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900">{analytics.filename}</span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                Active Batch
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Analyzed {analytics.total_users_analyzed.toLocaleString()} viewers • Processed with Scikit-Learn K-Means (K=5)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analytics.batch_id && <ExportMenu batchId={analytics.batch_id} />}
          <button
            onClick={() => onNavigateToUsers()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors"
          >
            <span>Explore Viewers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5 Real KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users Analyzed"
          value={analytics.total_users_analyzed.toLocaleString()}
          subtitle="Unique OTT viewer profiles"
          icon={Users}
          badge={{ text: 'Vectorized', variant: 'neutral' }}
        />
        <StatCard
          title="Audience Segments"
          value={analytics.num_segments}
          subtitle="Unsupervised KMeans personas"
          icon={PieIcon}
          badge={{ text: 'K=5 Live', variant: 'info' }}
        />
        <StatCard
          title="Avg Completion Rate"
          value={`${analytics.avg_completion_rate}%`}
          subtitle="Mean video progress"
          icon={Flame}
          badge={{ text: 'Catalog wide', variant: 'success' }}
        />
        <StatCard
          title="Avg Monthly Watch"
          value={`${analytics.avg_watch_time} hrs`}
          subtitle="Across active viewers"
          icon={Clock}
          badge={{ text: 'Aggregate', variant: 'neutral' }}
        />
        <StatCard
          title="ML Engine Status"
          value={analytics.model_status === 'ok' ? 'Healthy' : 'Degraded'}
          subtitle="Centroids & preprocessor loaded"
          icon={analytics.model_status === 'ok' ? CheckCircle2 : AlertCircle}
          badge={{
            text: analytics.model_status === 'ok' ? 'Online' : 'Check API',
            variant: analytics.model_status === 'ok' ? 'success' : 'warning',
          }}
        />
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audience Distribution Chart */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-stone-900">Audience Segment Distribution</h3>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Share</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">Percentage of viewers in each behavioral cluster</p>
          </div>
          <AudienceDistributionChart
            data={analytics.segment_distribution}
            onSelectSegment={(id) => onNavigateToUsers(id)}
          />
        </div>

        {/* Activity Comparison Chart */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-stone-900">Viewing Behavior by Segment</h3>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Telemetry</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">Comparison of watch time, session duration & completion</p>
          </div>
          <ActivityComparisonChart data={analytics.segment_distribution} />
        </div>

        {/* Genre Affinity Breakdown */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-stone-900">Genre Affinity Frequency</h3>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Affinities</span>
            </div>
            <p className="text-xs text-stone-500 mb-4">Number of users declaring top affinity per genre</p>
          </div>
          <GenreAffinityChart genreDistribution={analytics.genre_distribution} />
        </div>
      </div>

      {/* Discovered Personas Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">Audience Behavioral Segments</h2>
            <p className="text-xs text-stone-500">
              5 distinct viewer archetypes discovered through unsupervised clustering
            </p>
          </div>
          <button
            onClick={() => onNavigateToUsers()}
            className="text-xs font-semibold text-brand-900 hover:text-brand-950 flex items-center gap-1"
          >
            <span>View All User Lists</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

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
      </div>

      {/* Recent Batch History */}
      {analytics.recent_batches && analytics.recent_batches.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-stone-500" />
              <h3 className="text-sm font-bold text-stone-900">Recent Batch Processing Runs</h3>
            </div>
            <span className="text-xs text-stone-400">Isolated stored batches</span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {analytics.recent_batches.map((b) => (
              <div key={b.batch_id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900">{b.filename}</span>
                  <span className="text-stone-400 font-mono text-[11px] ml-2">({b.batch_id})</span>
                  <span className="text-stone-500 block text-[11px]">
                    {b.processed_rows.toLocaleString()} processed • {b.invalid_rows} rejected • {b.duplicate_rows} duplicates
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-stone-500">{b.processing_duration_ms}ms</span>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
