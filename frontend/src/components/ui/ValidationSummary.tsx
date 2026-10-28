import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Copy, Download } from 'lucide-react';
import { CSVValidationError, CSVValidationResponse } from '../../types';

interface ValidationSummaryProps {
  validation: CSVValidationResponse;
  onDownloadErrors?: () => void;
  batchId?: string;
  errorsDownloadUrl?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  validation,
  onDownloadErrors,
  errorsDownloadUrl,
}) => {
  const { total_rows, valid_rows, invalid_rows, duplicate_rows, errors } = validation;

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h4 className="text-sm font-bold text-stone-900">CSV Telemetry Validation Report</h4>
        {errors.length > 0 && errorsDownloadUrl && (
          <a
            href={errorsDownloadUrl}
            download="streamly_validation_errors.csv"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Error Log CSV</span>
          </a>
        )}
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
            Total Rows Detected
          </span>
          <span className="text-lg font-bold text-stone-900">{total_rows.toLocaleString()}</span>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Valid Telemetry Rows
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-lg font-bold text-emerald-900">{valid_rows.toLocaleString()}</span>
        </div>

        <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block">
              Invalid Rows
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="text-lg font-bold text-rose-900">{invalid_rows.toLocaleString()}</span>
        </div>

        <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">
              Duplicate User IDs
            </span>
            <Copy className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-lg font-bold text-amber-900">{duplicate_rows.toLocaleString()}</span>
        </div>
      </div>

      {/* Validation Errors Table */}
      {errors.length > 0 ? (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700 flex items-center gap-1.5 text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Detected Validation Issues ({errors.length})</span>
            </span>
            <span className="text-stone-400 text-[11px]">
              Invalid rows will be excluded from clustering inference.
            </span>
          </div>

          <div className="border border-rose-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-rose-50 text-rose-900 font-semibold text-[10px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="py-2 px-3">Row #</th>
                  <th className="py-2 px-3">User ID</th>
                  <th className="py-2 px-3">Column</th>
                  <th className="py-2 px-3">Error Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 text-stone-700 bg-white">
                {errors.map((err, i) => (
                  <tr key={i} className="hover:bg-rose-50/30">
                    <td className="py-2 px-3 font-mono font-bold text-stone-900">{err.row_index}</td>
                    <td className="py-2 px-3 font-mono text-stone-700">{err.user_id}</td>
                    <td className="py-2 px-3 font-medium text-rose-800">{err.column}</td>
                    <td className="py-2 px-3 text-rose-900">{err.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>All rows successfully passed schema and numeric telemetry validation! Ready for segmentation.</span>
        </div>
      )}
    </div>
  );
};
