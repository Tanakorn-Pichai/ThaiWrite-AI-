import React from 'react';
import { AnalysisResult } from '../../types';
import { FileText, AlignLeft, Sparkles, Award } from 'lucide-react';

interface SummaryStatsProps {
  result: AnalysisResult;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ result }) => {
  const stats = [
    {
      label: 'จำนวนคำ',
      value: `${result.wordCount.toLocaleString()} คำ`,
      icon: FileText,
      color: 'text-[#006241]',
      bg: 'bg-[#E2ECE5]',
    },
    {
      label: 'จำนวนประโยค',
      value: `${result.sentenceCount.toLocaleString()} ประโยค`,
      icon: AlignLeft,
      color: 'text-[#2563EB]',
      bg: 'bg-blue-50',
    },
    {
      label: 'ข้อเสนอแนะ',
      value: `${result.issueCount.toLocaleString()} จุด`,
      icon: Sparkles,
      color: 'text-[#E5A83B]',
      bg: 'bg-amber-50',
    },
    {
      label: 'คะแนนภาษา',
      value: `${result.score}/100`,
      icon: Award,
      color: 'text-[#006241]',
      bg: 'bg-[#E2ECE5]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.label}
            className="p-3.5 rounded-xl border border-[#DCE3DD] bg-white flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] sm:text-xs text-[#5A655E] font-medium">
                {stat.label}
              </span>
              <div className={`p-1.5 rounded-md ${stat.bg} ${stat.color}`}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#1E2923] font-mono tabular-nums">
              {stat.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
