import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ProcessingStatusProps {
  status: 'idle' | 'validating' | 'processing' | 'success' | 'error';
  message?: string;
  durationMs?: number;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  message,
  durationMs,
}) => {
  if (status === 'idle') return null;

  return (
    <div
      className={`rounded-xl p-4 border flex items-center justify-between text-xs transition-all ${
        status === 'processing' || status === 'validating'
          ? 'bg-plum-50/70 border-plum-200 text-plum-900'
          : status === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}
    >
      <div className="flex items-center gap-3">
        {status === 'processing' || status === 'validating' ? (
          <Loader2 className="w-5 h-5 text-plum-700 animate-spin flex-shrink-0" />
        ) : status === 'success' ? (
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
        )}
        <div>
          <span className="font-bold text-sm block">
            {status === 'validating' && 'Validating CSV Telemetry Schema...'}
            {status === 'processing' && 'Running Vectorized K-Means Inference...'}
            {status === 'success' && 'Audience Segmentation Completed Successfully!'}
            {status === 'error' && 'Segmentation Processing Failed'}
          </span>
          <span className="opacity-90 mt-0.5 block">{message}</span>
        </div>
      </div>

      {durationMs !== undefined && durationMs > 0 && (
        <span className="font-mono text-[11px] font-semibold opacity-75">
          {(durationMs / 1000).toFixed(2)}s
        </span>
      )}
    </div>
  );
};
