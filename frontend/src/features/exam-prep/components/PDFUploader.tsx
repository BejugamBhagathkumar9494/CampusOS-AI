import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
  BookOpen,
  Sparkles
} from 'lucide-react';

interface PDFFileItem {
  file: File;
  id: string;
  name: string;
  sizeFormatted: string;
  status: 'pending' | 'uploading' | 'processed' | 'failed';
  errorMessage?: string;
  unitGuess?: string;
}

interface PDFUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  subjectName?: string;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  onUpload,
  isUploading,
  subjectName = 'Subject'
}) => {
  const [selectedFiles, setSelectedFiles] = useState<PDFFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const guessUnit = (name: string): string => {
    const match = name.match(/(?:unit|module|chapter)[\s_-]*([0-9]+|[ivx]+)/i);
    if (match) return `Unit ${match[1].toUpperCase()}`;
    return 'General';
  };

  const handleFilesAdded = (files: FileList | File[]) => {
    const newItems: PDFFileItem[] = [];
    Array.from(files).forEach((f) => {
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        // Avoid duplicate by name in current batch
        if (!selectedFiles.some((item) => item.name === f.name)) {
          newItems.push({
            file: f,
            id: Math.random().toString(36).substring(2, 9),
            name: f.name,
            sizeFormatted: formatFileSize(f.size),
            status: 'pending',
            unitGuess: guessUnit(f.name)
          });
        }
      }
    });
    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    const rawFiles = selectedFiles.map((item) => item.file);
    await onUpload(rawFiles);
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesAdded(e.target.files);
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
          <UploadCloud className="w-8 h-8 animate-bounce-slow" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 text-center">
          Upload Multiple PDF Notes for <span className="text-indigo-600">{subjectName}</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 text-center mt-1 max-w-md">
          Drag & drop all B.Tech unit notes (e.g. Unit 1.pdf, Unit 2.pdf) or click to browse.
        </p>

        <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200">
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          <span>All units processed together as a single knowledge collection</span>
        </div>
      </div>

      {/* Selected Files List with status */}
      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">
                Uploaded Lessons / Unit Files ({selectedFiles.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add more PDFs
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                      <span>{item.sizeFormatted}</span>
                      <span>•</span>
                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                        {item.unitGuess}
                      </span>
                    </div>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(item.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove PDF"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={isUploading || selectedFiles.length === 0}
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting & Indexing Lessons...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Process All {selectedFiles.length} PDFs for Exam Preparation
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
