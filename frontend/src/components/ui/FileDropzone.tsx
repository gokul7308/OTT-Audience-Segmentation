import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, AlertCircle } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  maxSizeBytes?: number;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelected,
  selectedFile,
  onClearFile,
  maxSizeBytes = 50 * 1024 * 1024,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file type. Please upload a standard CSV file (.csv).');
      return;
    }
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds maximum allowed limit (${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB).`);
      return;
    }
    setError(null);
    onFileSelected(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {selectedFile ? (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-900 border border-brand-200 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 truncate max-w-md">{selectedFile.name}</h4>
              <p className="text-xs text-stone-500">{formatFileSize(selectedFile.size)} • Ready for validation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Replace
            </button>
            <button
              onClick={onClearFile}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
              title="Remove File"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-700 bg-brand-50/50'
              : 'border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-400'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-2xs border border-stone-200 flex items-center justify-center mx-auto text-stone-600 mb-3">
            <UploadCloud className="w-6 h-6 text-brand-900" />
          </div>
          <h4 className="text-sm font-bold text-stone-800">
            Click to upload or drag & drop audience CSV
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Supports CSV files up to {(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB
          </p>
          <button
            type="button"
            className="mt-4 px-4 py-2 text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-lg shadow-2xs transition-colors"
          >
            Browse Files
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
