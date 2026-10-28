import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Play,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { BatchSummary, CSVValidationResponse, UserRecord } from '../types';
import { FileDropzone } from '../components/ui/FileDropzone';
import { CSVPreviewTable } from '../components/ui/CSVPreviewTable';
import { ValidationSummary } from '../components/ui/ValidationSummary';
import { ProcessingStatus } from '../components/ui/ProcessingStatus';
import { ExportMenu } from '../components/ui/ExportMenu';

interface CSVImportPageProps {
  onBatchCompleted: (batch: BatchSummary) => void;
  onNavigateToUsers: (segmentId?: number) => void;
}

export const CSVImportPage: React.FC<CSVImportPageProps> = ({
  onBatchCompleted,
  onNavigateToUsers,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'keep_first' | 'reject_duplicates'>('keep_first');

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CSVValidationResponse | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [processingError, setProcessingError] = useState<string | null>(null);

  const [completedBatch, setCompletedBatch] = useState<{
    summary: BatchSummary;
    preview_users: UserRecord[];
    validation_errors: any[];
  } | null>(null);

  const handleValidate = async () => {
    if (!selectedFile) return;
    setIsValidating(true);
    setValidationResult(null);
    setProcessingError(null);
    try {
      const res = await api.validateCSV(selectedFile, duplicatePolicy);
      setValidationResult(res);
    } catch (err: any) {
      setProcessingError(err.message || 'Validation request failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRunSegmentation = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProcessingStatus('processing');
    setProcessingError(null);
    try {
      const res = await api.uploadAndProcessBatch(selectedFile, duplicatePolicy);
      setCompletedBatch(res);
      setProcessingStatus('success');
      onBatchCompleted(res.summary);
    } catch (err: any) {
      setProcessingStatus('error');
      setProcessingError(err.message || 'Failed to process batch.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setCompletedBatch(null);
    setProcessingStatus('idle');
    setProcessingError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header & Purpose */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">Import & Segment Audience</h2>
            <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
              Upload an OTT user activity CSV to classify viewers into five behavioral audience segments using the trained Streamly ML model.
            </p>
          </div>
          <a
            href={api.getSampleCSVUrl()}
            download="streamly_sample_audience.csv"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Download Sample CSV Template</span>
          </a>
        </div>
      </div>

      {/* If Completed: Show Full Completion Results Summary */}
      {completedBatch ? (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Audience Segmentation Batch Completed</h3>
                <p className="text-xs text-stone-500">
                  Batch ID: <span className="font-mono font-semibold text-stone-700">{completedBatch.summary.batch_id}</span> •{' '}
                  {completedBatch.summary.filename}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
              Status: Success
            </span>
          </div>

          {/* Completed Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200/80">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Rows Received</span>
              <span className="text-xl font-bold text-stone-900">{completedBatch.summary.total_rows.toLocaleString()}</span>
            </div>
            <div className="p-3.5 bg-emerald-50/70 rounded-lg border border-emerald-200/80">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Successfully Segmented</span>
              <span className="text-xl font-bold text-emerald-900">{completedBatch.summary.valid_rows.toLocaleString()}</span>
            </div>
            <div className="p-3.5 bg-rose-50/70 rounded-lg border border-rose-200/80">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">Rejected / Invalid Rows</span>
              <span className="text-xl font-bold text-rose-900">{completedBatch.summary.invalid_rows.toLocaleString()}</span>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200/80">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Processing Duration</span>
              <span className="text-xl font-bold text-stone-900 font-mono">
                {(completedBatch.summary.processing_duration_ms / 1000).toFixed(2)}s
              </span>
            </div>
          </div>

          {/* Segment Distribution Pill Badges */}
          <div className="p-4 bg-stone-50/60 rounded-xl border border-stone-200 space-y-2">
            <span className="text-xs font-bold text-stone-700 block">Five Audience Personas Populated:</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              {Object.entries(completedBatch.summary.segment_counts).map(([segId, count]) => (
                <div key={segId} className="p-2.5 bg-white rounded-lg border border-stone-200 text-center">
                  <span className="text-[10px] font-bold text-brand-900 block uppercase">Segment {segId}</span>
                  <span className="text-base font-bold text-stone-900">{count.toLocaleString()}</span>
                  <span className="text-[10px] text-stone-500 block">
                    ({completedBatch.summary.segment_percentages[segId]}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start Another Import</span>
            </button>

            <div className="flex items-center gap-2">
              <ExportMenu
                batchId={completedBatch.summary.batch_id}
                hasErrors={completedBatch.summary.invalid_rows > 0}
              />

              <button
                onClick={() => onNavigateToUsers()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-brand-900 hover:bg-brand-950 text-white rounded-lg shadow-sm transition-all"
              >
                <span>View Segmented Users</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Import Form */
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            selectedFile={selectedFile}
            onFileSelected={(f) => {
              setSelectedFile(f);
              setValidationResult(null);
            }}
            onClearFile={handleReset}
          />

          {/* Upload Configuration & Policy */}
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-stone-800 block">Duplicate User ID Policy:</span>
              <p className="text-stone-500 text-[11px] mt-0.5">
                Choose how duplicate telemetry entries with identical user IDs should be handled.
              </p>
            </div>
            <select
              value={duplicatePolicy}
              onChange={(e) => setDuplicatePolicy(e.target.value as any)}
              className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-800 outline-none cursor-pointer"
            >
              <option value="keep_first">Keep First Occurrence (Report Subsequent as Duplicates)</option>
              <option value="reject_duplicates">Reject All Duplicates</option>
            </select>
          </div>

          {/* Validation & Processing Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleValidate}
                disabled={!selectedFile || isValidating || isProcessing}
                className="px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors disabled:opacity-50"
              >
                {isValidating ? 'Validating CSV...' : 'Validate CSV Schema'}
              </button>
            </div>

            <button
              onClick={handleRunSegmentation}
              disabled={!selectedFile || isProcessing || isValidating}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-brand-900 hover:bg-brand-950 text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isProcessing ? 'Processing Model Inference...' : 'Run Segmentation'}</span>
            </button>
          </div>

          {/* Processing Status Banner */}
          <ProcessingStatus
            status={processingStatus}
            message={processingError || 'Vectorizing features and computing cluster distances...'}
          />

          {/* Pre-flight Validation Report */}
          {validationResult && (
            <div className="space-y-4 pt-4 border-t border-stone-200">
              <ValidationSummary
                validation={validationResult}
                errorsDownloadUrl={
                  validationResult.errors.length > 0
                    ? `data:text/csv;charset=utf-8,${encodeURIComponent(
                        'row_index,user_id,column,error\n' +
                          validationResult.errors
                            .map((e) => `${e.row_index},"${e.user_id}","${e.column}","${e.error}"`)
                            .join('\n')
                      )}`
                    : undefined
                }
              />

              {validationResult.preview_rows.length > 0 && (
                <CSVPreviewTable rows={validationResult.preview_rows} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Schema Guidance Box */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-xs text-stone-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-stone-800">
          <HelpCircle className="w-4 h-4 text-stone-500" />
          <span>Expected CSV Telemetry Schema</span>
        </div>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          Required headers: <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-stone-800">user_id</code>,{' '}
          <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-stone-800">watch_time_hours</code>,{' '}
          <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-stone-800">avg_session_mins</code>.
          <br />
          Optional extended features: <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-stone-800">sessions_per_week</code>,{' '}
          <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-stone-800">completion_rate</code> (0.0 to 1.0),{' '}
          <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-stone-800">weekend_usage_ratio</code> (0.0 to 1.0),{' '}
          <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-stone-800">genre_diversity</code>,{' '}
          <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-stone-800">top_genres</code> (pipe-separated e.g.{' '}
          <code className="font-mono text-stone-700">Action|Sci-Fi|Thriller</code>).
        </p>
      </div>
    </div>
  );
};
