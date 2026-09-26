import React from 'react';
import { UploadedFile } from '../../types';
import { FileText, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';

interface FilePreviewProps {
  file: UploadedFile;
  onRemove: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const isDocx = file.name.toLowerCase().endsWith('.docx');

  return (
    <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-[#006241]/25 bg-[#E2ECE5]/50 shadow-xs transition-all">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isPdf
              ? 'bg-rose-100 text-rose-700'
              : isDocx
              ? 'bg-blue-100 text-blue-700'
              : 'bg-[#E2ECE5] text-[#006241]'
          }`}
        >
          {isDocx ? (
            <FileSpreadsheet className="w-5 h-5" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#1E2923] truncate max-w-[200px] sm:max-w-xs">
              {file.name}
            </p>
            <span className="inline-flex items-center text-[#006241]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-[#5A655E] font-mono tabular-nums">
            {file.formattedSize}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-[#5A655E] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
        title="ลบไฟล์"
        aria-label="ลบไฟล์เอกสาร"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
