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
            ? 'border-[#C85A32] bg-[#FDF2ED] scale-[1.01]'
            : 'border-[#EAE3D8] hover:border-[#C85A32] bg-[#FAF7F2] hover:bg-[#FDF2ED]/50'
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

        <div className="w-16 h-16 rounded-2xl bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center mb-4 shadow-inner">
          <UploadCloud className="w-8 h-8 animate-bounce-slow" />
        </div>

        <h3 className="text-lg font-bold text-[#1C211F] text-center">
          Upload Multiple PDF Notes for <span className="text-[#C85A32]">{subjectName}</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#5E6763] text-center mt-1 max-w-md">
          Drag & drop all B.Tech unit notes (e.g. Unit 1.pdf, Unit 2.pdf) or click to browse.
        </p>

        <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold text-[#5E6763] bg-white px-3 py-1.5 rounded-full border border-[#EAE3D8]">
          <FileText className="w-3.5 h-3.5 text-[#C85A32]" />
          <span>All units processed together as a single knowledge collection</span>
        </div>
      </div>

      {/* Selected Files List with status */}
      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D8] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3ECE2] pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C85A32]" />
              <span className="text-sm font-bold text-[#1C211F]">
                Uploaded Lessons / Unit Files ({selectedFiles.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-[#C85A32] hover:text-[#B44E27] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add more PDFs
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] hover:border-[#C85A32]/40 transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[#1C211F] truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8E9893] font-medium">
                      <span>{item.sizeFormatted}</span>
                      <span>•</span>
                      <span className="bg-[#FDF2ED] text-[#C85A32] px-1.5 py-0.2 rounded font-bold">
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
                    className="p-1.5 rounded-lg text-[#8E9893] hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
              className="px-6 py-3 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-lg shadow-[#C85A32]/20 disabled:opacity-50 transition-all flex items-center gap-2"
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
