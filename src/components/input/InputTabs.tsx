import React from 'react';
import { InputMode } from '../../types';
import { FileText, UploadCloud, Lock } from 'lucide-react';

interface InputTabsProps {
  mode: InputMode;
  onSelectMode: (mode: InputMode) => void;
  disabledTextMode?: boolean;
  disabledReason?: string;
}

export const InputTabs: React.FC<InputTabsProps> = ({
  mode,
  onSelectMode,
  disabledTextMode = false,
  disabledReason = 'โหมดตรวจโครงสร้างหรือเทียบแม่แบบรองรับเฉพาะไฟล์เอกสาร',
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-1.5 p-1 bg-[#E2ECE5]/70 rounded-xl w-full max-w-xs border border-[#DCE3DD]">
        <button
          type="button"
          disabled={disabledTextMode}
          onClick={() => !disabledTextMode && onSelectMode('text')}
          title={disabledTextMode ? disabledReason : 'พิมพ์หรือวางข้อความ'}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
            disabledTextMode
              ? 'opacity-40 cursor-not-allowed text-[#828F86] bg-transparent'
              : mode === 'text'
              ? 'bg-white text-[#1E2923] shadow-xs font-semibold cursor-pointer'
              : 'text-[#5A655E] hover:text-[#1E2923] hover:bg-white/40 cursor-pointer'
          }`}
        >
          {disabledTextMode ? (
            <Lock className="w-3.5 h-3.5 text-[#828F86]" />
          ) : (
            <FileText className="w-4 h-4 text-[#006241]" />
          )}
          <span>ข้อความ</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
            mode === 'file'
              ? 'bg-white text-[#1E2923] shadow-xs font-semibold'
              : 'text-[#5A655E] hover:text-[#1E2923] hover:bg-white/40'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-[#006241]" />
          <span>ไฟล์เอกสาร</span>
        </button>
      </div>

      {disabledTextMode && (
        <span className="text-[11px] text-[#006241] font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#006241]" />
          บังคับใช้ไฟล์เอกสาร (เมื่อเลือกตรวจโครงสร้าง/แม่แบบ)
        </span>
      )}
    </div>
  );
};
