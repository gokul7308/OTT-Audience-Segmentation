import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../../api/client';

interface ExportMenuProps {
  batchId: string;
  hasErrors?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ batchId, hasErrors = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const segments = [
    { id: 0, name: 'Segment 0: Action & Sci-Fi Power' },
    { id: 1, name: 'Segment 1: Casual Weekend Viewers' },
    { id: 2, name: 'Segment 2: Genre Explorers' },
    { id: 3, name: 'Segment 3: Focused Drama & Story' },
    { id: 4, name: 'Segment 4: Family & Animation' },
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-[0.99]"
      >
        <Download className="w-3.5 h-3.5 text-stone-600" />
        <span>Export CSVs</span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-30 divide-y divide-stone-100 animate-in fade-in zoom-in-95 duration-100">
          {/* Complete Dataset Option */}
          <div className="px-1 py-1">
            <a
              href={api.getExportUrl(batchId)}
              download={`streamly_batch_${batchId}_results.csv`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-brand-900 flex-shrink-0" />
              <div>
                <span className="block">Complete Processed Dataset</span>
                <span className="text-[10px] font-normal text-stone-500">All segmented viewer records</span>
              </div>
            </a>
          </div>

          {/* Individual Segment Exports */}
          <div className="px-1 py-1">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Export Segment Lists
            </span>
            {segments.map((s) => (
              <a
                key={s.id}
                href={api.getExportUrl(batchId, s.id)}
                download={`streamly_segment_${s.id}.csv`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors truncate"
              >
                <Layers className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <span className="truncate">{s.name}</span>
              </a>
            ))}
          </div>

          {/* Validation Errors Export */}
          {hasErrors && (
            <div className="px-1 py-1">
              <a
                href={api.getErrorsExportUrl(batchId)}
                download="streamly_validation_errors.csv"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span>Export Validation Errors CSV</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
