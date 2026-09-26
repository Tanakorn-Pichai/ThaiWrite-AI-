import React, { useRef, useState } from 'react';
import { UploadCloud, FileType2, Loader2 } from 'lucide-react';
import { UploadedFile } from '../../types';
import { extractTextFromFile } from '../../utils/fileExtractor';

interface FileDropzoneProps {
  onFileSelect: (file: UploadedFile) => void;
  onError: (msg: string) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  onError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateAndProcessFile = async (file: File) => {
    const validExtensions = ['.docx', '.pdf', '.txt'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt) {
      onError('กรุณาอัปโหลดไฟล์ .docx, .pdf หรือ .txt เท่านั้น');
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      onError('ขนาดไฟล์เกิน 10 MB');
      return;
    }

    setIsExtracting(true);
    try {
      const extractedContent = await extractTextFromFile(file);
      onFileSelect({
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        type: file.type || 'document',
        content: extractedContent,
        rawFile: file,
      });
    } catch {
      onFileSelect({
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        type: file.type || 'document',
        rawFile: file,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 sm:p-7 text-center cursor-pointer transition-all ${
        isDragging
          ? 'border-[#006241] bg-[#E2ECE5]/70 scale-[0.99]'
          : 'border-[#DCE3DD] hover:border-[#006241]/60 bg-[#FFFFFF]'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      aria-label="อัปโหลดไฟล์เอกสาร"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf,.txt"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center justify-center gap-2.5">
        {isExtracting ? (
          <div className="py-2 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-[#006241] animate-spin" />
            <p className="text-xs font-semibold text-[#006241]">
              กำลังอ่านและดึงเนื้อหาจากเอกสารจริง...
            </p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[#E2ECE5] flex items-center justify-center text-[#006241] shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm sm:text-base font-semibold text-[#1E2923]">
                ลากและวางไฟล์ หรือ <span className="text-[#006241] underline underline-offset-2">เลือกไฟล์</span>
              </p>
              <p className="text-xs text-[#5A655E] mt-0.5">
                รองรับ .docx, .pdf, .txt (ไม่เกิน 10 MB)
              </p>
            </div>
          </>
        )}

        <div className="flex items-center gap-2.5 pt-1 text-xs text-[#828F86]">
          <span className="flex items-center gap-1 font-mono">
            <FileType2 className="w-3.5 h-3.5 text-[#006241]" /> .docx
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 font-mono">
            <FileType2 className="w-3.5 h-3.5 text-[#006241]" /> .pdf
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 font-mono">
            <FileType2 className="w-3.5 h-3.5 text-[#006241]" /> .txt
          </span>
        </div>
      </div>
    </div>
  );
};
