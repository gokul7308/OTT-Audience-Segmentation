import React from 'react';
import {
  UploadCloud,
  Layers,
  RefreshCw,
  Menu,
} from 'lucide-react';
import { BatchSummary } from '../../types';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: string[];
  batches: BatchSummary[];
  selectedBatchId: string | null;
  onSelectBatch: (batchId: string) => void;
  onRefresh: () => void;
  onOpenImport: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = ['Platform'],
  batches,
  selectedBatchId,
  onSelectBatch,
  onRefresh,
  onOpenImport,
  isRefreshing = false,
  onToggleMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title with Breadcrumbs */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400 mb-0.5">
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={idx}>
                  <span>{b}</span>
                  {idx < breadcrumbs.length - 1 && <span>/</span>}
                </React.Fragment>
              ))}
              <span>/</span>
              <span className="text-stone-700 font-semibold">{title}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">{title}</h1>
              {subtitle && (
                <span className="hidden sm:inline-block text-xs font-normal text-stone-500 border-l border-stone-200 pl-3">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Batch Selector, Refresh, and Primary Action */}
        <div className="flex items-center gap-3">
          {/* Active Batch Selector */}
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
            <Layers className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <select
              value={selectedBatchId || ''}
              onChange={(e) => onSelectBatch(e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-800 outline-none cursor-pointer max-w-[180px] truncate"
              title="Select Active Audience Batch"
            >
              {batches.length === 0 ? (
                <option value="">No Batches Processed</option>
              ) : (
                batches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.filename} ({b.processed_rows.toLocaleString()} users)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-700' : ''}`} />
          </button>

          {/* Quick Import CTA */}
          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-900 hover:bg-brand-950 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Import Audience CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
