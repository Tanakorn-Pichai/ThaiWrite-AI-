import React, { useState } from 'react';
import { Sparkles, ClipboardCheck, Copy, Check } from 'lucide-react';

interface ImprovedTextProps {
  originalText: string;
  improvedText: string;
  onApplyImprovement: () => void;
  onCopySuccess: () => void;
}

export const ImprovedText: React.FC<ImprovedTextProps> = ({
  originalText,
  improvedText,
  onApplyImprovement,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(improvedText);
      setCopied(true);
      onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      onCopySuccess();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#006241]" />
          <h3 className="text-sm font-bold text-[#1E2923]">
            ข้อความฉบับปรับปรุง
          </h3>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs text-[#5A655E] hover:text-[#1E2923] px-2.5 py-1 rounded-lg hover:bg-[#E2ECE5] transition-colors cursor-pointer"
          title="คัดลอกข้อความ"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#006241]" />
              <span className="text-[#006241] font-medium">คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>คัดลอก</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {/* Original Text Card */}
        <div className="p-3 sm:p-3.5 rounded-xl border border-[#DCE3DD] bg-[#FFFFFF]">
          <span className="text-[11px] font-semibold text-[#828F86] block mb-1">
            ข้อความต้นฉบับ
          </span>
          <p className="text-xs sm:text-sm text-[#5A655E] leading-relaxed">
            {originalText}
          </p>
        </div>

        {/* Improved Text Card */}
        <div className="p-3 sm:p-3.5 rounded-xl border border-[#006241]/30 bg-[#E2ECE5]/50 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-[#006241]">
              ข้อความที่แนะนำ (ปรับภาษาแล้ว)
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#1E2923] leading-relaxed">
            {improvedText}
          </p>
        </div>
      </div>

      {/* Apply Button */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={onApplyImprovement}
          className="w-full py-2.5 px-4 rounded-xl bg-[#E2ECE5] hover:bg-[#d5e4d9] text-[#1E2923] border border-[#006241]/25 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <ClipboardCheck className="w-4 h-4 text-[#006241]" />
          <span>ใช้ข้อความนี้แทนที่ในกล่องข้อความ</span>
        </button>
      </div>
    </div>
  );
};
