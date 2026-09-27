import React from 'react';
import { ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { IssueHighlight, CategoryCounts } from '../../types';

interface IssueRecommendationProps {
  originalText: string;
  detectedText: string;
  replacement: string;
  reason: string;
  highlights?: IssueHighlight[];
  activeFilter?: keyof CategoryCounts | null;
}

const CATEGORY_MAP: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  spelling: {
    label: 'คำสะกด',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-[#D9534F]',
  },
  grammar: {
    label: 'ไวยากรณ์',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-[#E5A83B]',
  },
  wordUsage: {
    label: 'การใช้คำ',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-[#3182CE]',
  },
  academic: {
    label: 'ภาษาวิชาการ',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-[#805AD5]',
  },
};

export const IssueRecommendation: React.FC<IssueRecommendationProps> = ({
  originalText,
  detectedText,
  replacement,
  reason,
  highlights,
  activeFilter,
}) => {
  // Determine effective highlights to render
  const effectiveHighlights: IssueHighlight[] =
    highlights && highlights.length > 0
      ? highlights
      : detectedText
      ? [{ text: detectedText, type: 'grammar', replacement, reason }]
      : [];

  const filteredHighlights = activeFilter
    ? effectiveHighlights.filter((h) => h.type === activeFilter)
    : effectiveHighlights;

  // If no issues detected
  if (effectiveHighlights.length === 0) {
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
          {reason ||
            'ไม่พบคำสะกดผิด คำฟุ่มเฟือย หรือข้อผิดพลาดทางไวยากรณ์ในข้อความนี้ ข้อความถูกต้องตามมาตรฐานแล้ว'}
        </p>
      </div>
    );
  }

  // Highlight the target text within the snippet
  const renderHighlightedSnippet = (targetText: string) => {
    if (!originalText || !originalText.includes(targetText)) {
      return <span>{originalText || targetText}</span>;
    }

    const parts = originalText.split(targetText);
    return (
      <span className="leading-relaxed">
        {parts[0]}
        <mark className="bg-amber-100 text-amber-900 font-semibold px-1.5 py-0.5 rounded border border-amber-300 mx-0.5">
          {targetText}
        </mark>
        {parts.slice(1).join(targetText)}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-[#E5A83B]/40 bg-amber-50/40 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-amber-100 text-amber-800">
            <Lightbulb className="w-4 h-4 text-[#E5A83B]" />
          </span>
          <h3 className="text-sm font-bold text-[#1E2923]">
            จุดที่ตรวจพบและคำแนะนำ ({filteredHighlights.length} จุด)
          </h3>
        </div>
        {activeFilter && (
          <span className="text-xs text-[#5A655E] bg-white px-2.5 py-0.5 rounded-full border border-[#DCE3DD] font-medium">
            กรองตาม: {CATEGORY_MAP[activeFilter]?.label || activeFilter}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {filteredHighlights.map((issue, idx) => {
          const categoryInfo = CATEGORY_MAP[issue.type] || {
            label: 'ไวยากรณ์',
            badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
            dotClass: 'bg-[#E5A83B]',
          };

          return (
            <div
              key={`${issue.text}-${idx}`}
              className="p-3.5 rounded-xl bg-white border border-[#DCE3DD] shadow-2xs space-y-2.5 transition-all hover:border-[#006241]/40"
            >
              {/* Card Header: Index + Category Tag */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#006241] text-white flex items-center justify-center text-[10px] font-bold font-mono">
                    {idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${categoryInfo.badgeClass}`}
                  >
                    {categoryInfo.label}
                  </span>
                </div>
              </div>

              {/* Context Snippet */}
              <div className="p-2.5 rounded-lg bg-[#F4F6F4] border border-[#DCE3DD]/70 text-xs text-[#1E2923]">
                <p className="text-[10px] text-[#828F86] mb-1 font-medium">
                  ข้อความในบริบท:
                </p>
                <div>{renderHighlightedSnippet(issue.text)}</div>
              </div>

              {/* Suggestion Old -> New */}
              <div className="flex flex-wrap items-center gap-2 py-1.5 px-2.5 rounded-lg bg-amber-50/50 border border-amber-200/80 text-xs sm:text-sm">
                <span className="font-semibold text-rose-700 line-through bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {issue.text}
                </span>
                <ArrowRight className="w-4 h-4 text-[#006241] shrink-0" />
                <span className="font-semibold text-[#006241] bg-[#E2ECE5] px-2 py-0.5 rounded border border-[#006241]/20">
                  {issue.replacement || '(ตัดออก)'}
                </span>
              </div>

              {/* Description */}
              <div className="text-xs text-[#5A655E] leading-relaxed flex items-start gap-1.5">
                <span className="font-semibold text-[#1E2923] shrink-0">
                  คำอธิบาย:
                </span>
                <span>{issue.reason}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
