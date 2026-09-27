import React from 'react';
import { ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';

interface IssueRecommendationProps {
  originalText: string;
  detectedText: string;
  replacement: string;
  reason: string;
}

export const IssueRecommendation: React.FC<IssueRecommendationProps> = ({
  originalText,
  detectedText,
  replacement,
  reason,
}) => {
  // If no specific issue detected
  if (!detectedText) {
    return (
      <div className="p-4 sm:p-5 rounded-xl border border-[#006241]/30 bg-[#E2ECE5]/60">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1 rounded-md bg-[#006241] text-white">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-[#1E2923]">
            ผลการตรวจสอบ: ไม่พบข้อผิดพลาด
          </h3>
        </div>
        <p className="text-xs text-[#5A655E] leading-relaxed">
          {reason || 'ไม่พบคำสะกดผิดหรือข้อผิดพลาดทางไวยากรณ์ในข้อความนี้ ข้อความถูกต้องตามมาตรฐานแล้ว'}
        </p>
      </div>
    );
  }

  // Highlight the detectedText within the originalText snippet
  const renderHighlightedSnippet = () => {
    if (!originalText || !originalText.includes(detectedText)) {
      return <span>{originalText}</span>;
    }

    const parts = originalText.split(detectedText);
    return (
      <span className="leading-relaxed">
        {parts[0]}
        <mark className="bg-amber-100 text-amber-900 font-semibold px-1.5 py-0.5 rounded border border-amber-300 mx-0.5">
          {detectedText}
        </mark>
        {parts.slice(1).join(detectedText)}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-[#E5A83B]/40 bg-amber-50/40">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="p-1 rounded-md bg-amber-100 text-amber-800">
          <Lightbulb className="w-4 h-4 text-[#E5A83B]" />
        </span>
        <h3 className="text-sm font-bold text-[#1E2923]">
          จุดที่ตรวจพบและคำแนะนำ
        </h3>
      </div>

      {/* Snippet with highlight */}
      <div className="p-3 rounded-lg bg-white border border-[#DCE3DD] text-xs sm:text-sm text-[#1E2923] mb-3 shadow-2xs">
        <p className="text-[11px] text-[#828F86] mb-1 font-medium">ข้อความในบริบท:</p>
        <div>{renderHighlightedSnippet()}</div>
      </div>

      {/* Suggestion Old -> New */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2 px-3 rounded-lg bg-white/90 border border-amber-200/80 mb-2.5 text-xs sm:text-sm">
        <span className="font-semibold text-rose-700 line-through bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          {detectedText}
        </span>
        <ArrowRight className="w-4 h-4 text-[#006241] shrink-0" />
        <span className="font-semibold text-[#006241] bg-[#E2ECE5] px-2 py-0.5 rounded border border-[#006241]/20">
          {replacement}
        </span>
      </div>

      {/* Reason */}
      <div className="text-xs text-[#5A655E] leading-relaxed flex items-start gap-1.5">
        <span className="font-semibold text-[#1E2923] shrink-0">คำอธิบาย:</span>
        <span>{reason}</span>
      </div>
    </div>
  );
};
