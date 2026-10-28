import React from 'react';
import { Settings, Server, HardDrive, Shield, FileText, Info } from 'lucide-react';
import { API_BASE_URL } from '../api/client';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-brand-900" />
          <h2 className="text-base font-bold text-stone-900">Platform Settings & Configuration</h2>
        </div>
        <p className="text-xs text-stone-500 max-w-xl leading-relaxed">
          Runtime environment configuration, backend API connectivity, storage paths, and security constraints.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-5 text-xs">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-stone-500" />
          <span>API & Backend Connectivity</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">VITE_API_BASE_URL</span>
            <span className="font-mono text-stone-900 font-semibold mt-1 block">{API_BASE_URL}</span>
            <span className="text-[11px] text-stone-500 mt-1 block">Configurable via .env or container environment</span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">CORS Configuration</span>
            <span className="font-mono text-stone-900 font-semibold mt-1 block">Enabled (Development & Docker)</span>
            <span className="text-[11px] text-stone-500 mt-1 block">Managed by FastAPI CORSMiddleware</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-5 text-xs">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-stone-500" />
          <span>Batch Data Storage & Persistence</span>
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Batch Storage Directory</span>
            <span className="font-mono text-stone-900 font-semibold mt-1 block">data/batches/</span>
            <span className="text-[11px] text-stone-500 mt-1 block">
              Each completed CSV upload is saved in an isolated subfolder containing summary.json, results.csv, errors.csv, and segment_{`{0..4}`}.csv.
            </span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Container Restart Persistence</span>
            <span className="text-stone-700 mt-1 block leading-relaxed">
              Batch files stored on the host filesystem or mounted Docker volume persist across application and container restarts.
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-5 text-xs">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-stone-500" />
          <span>Security & Input Sanitation</span>
        </h3>

        <div className="space-y-2 text-stone-600 leading-relaxed">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Spreadsheet Formula Injection Defense:</strong> Cells beginning with characters <code className="bg-stone-100 px-1 py-0.5 rounded border border-stone-200 font-mono">= + - @ \t \r</code> are prefixed with an apostrophe during CSV exports.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Path Traversal Protection:</strong> Batch IDs are validated against strict alphanumeric regex <code className="bg-stone-100 px-1 py-0.5 rounded border border-stone-200 font-mono">^[a-zA-Z0-9_-]+$</code> before filesystem access.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong>File Upload Constraints:</strong> Enforces 50 MB file size limit and up to 100,000 maximum row processing per batch.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
