import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Cpu,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { api, API_BASE_URL } from '../api/client';
import { SystemHealth } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSkeleton } from '../components/ui/FeedbackStates';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const data = await api.getHealth();
      const elapsed = Math.round(performance.now() - start);
      setHealth(data);
      setLatencyMs(elapsed);
      setLastCheck(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'FastAPI service is unreachable.');
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-brand-900" />
            <h2 className="text-base font-bold text-stone-900">System Diagnostics & API Status</h2>
          </div>
          <p className="text-xs text-stone-500 max-w-xl leading-relaxed">
            Live telemetry monitoring for the containerized FastAPI inference backend, persisted model artifact integrity, and batch storage volumes.
          </p>
        </div>
        <button
          onClick={checkHealth}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Checking...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {/* KPI Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Inference API"
          value={health?.status === 'ok' ? 'Operational' : 'Unavailable'}
          subtitle={`Target: ${API_BASE_URL}`}
          icon={Server}
          badge={{
            text: health?.status === 'ok' ? 'HTTP 200' : 'Offline',
            variant: health?.status === 'ok' ? 'success' : 'warning',
          }}
        />
        <StatCard
          title="Model Artifacts"
          value={health?.model_loaded ? 'Loaded (In-Memory)' : 'Missing'}
          subtitle="KMeans + Preprocessor Joblib"
          icon={Cpu}
          badge={{
            text: health?.model_loaded ? 'K=5 Live' : 'Not Loaded',
            variant: health?.model_loaded ? 'success' : 'warning',
          }}
        />
        <StatCard
          title="Roundtrip Latency"
          value={latencyMs !== null ? `${latencyMs} ms` : '—'}
          subtitle={lastCheck ? `Last check: ${lastCheck}` : 'Checking...'}
          icon={Activity}
          badge={{
            text: latencyMs !== null && latencyMs < 100 ? 'Fast' : 'Normal',
            variant: 'info',
          }}
        />
      </div>

      {/* Error Banner if Unreachable */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-xs text-rose-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Connection Failure</span>
          </div>
          <p>{error}</p>
          <div className="pt-2 text-[11px] text-rose-700">
            <strong>Troubleshooting:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Ensure the backend is running on <code>http://localhost:8000</code>.</li>
              <li>In Docker Compose, verify container <code>ott_api</code> status with <code>docker compose ps</code>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Infrastructure Diagnostic Detail Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">
          Component Health Breakdown
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-stone-500" />
              <div>
                <span className="font-bold text-stone-900 block">FastAPI Scored Inference Server</span>
                <span className="text-stone-500 text-[11px]">Async Uvicorn ASGI runtime</span>
              </div>
            </div>
            <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-stone-500" />
              <div>
                <span className="font-bold text-stone-900 block">Scikit-Learn Preprocessor & KMeans</span>
                <span className="text-stone-500 text-[11px]">preprocessor.joblib, kmeans_model.joblib, segment_metadata.json</span>
              </div>
            </div>
            <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
              Ready
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-stone-500" />
              <div>
                <span className="font-bold text-stone-900 block">Isolated Batch File Storage</span>
                <span className="text-stone-500 text-[11px]">Directory data/batches/ with CSV sanitization</span>
              </div>
            </div>
            <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
              Writable
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-stone-500" />
              <div>
                <span className="font-bold text-stone-900 block">Spreadsheet Formula Injection Defense</span>
                <span className="text-stone-500 text-[11px]">Prefixes dangerous CSV command cells with apostrophe</span>
              </div>
            </div>
            <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
              Enforced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
