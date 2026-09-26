import React from 'react';
import { WritingStyle } from '../../types';

interface WritingStyleSelectorProps {
  selectedStyle: WritingStyle;
  onSelectStyle: (style: WritingStyle) => void;
}

export const WritingStyleSelector: React.FC<WritingStyleSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
}) => {
  const styles: WritingStyle[] = [
    'ทั่วไป',
    'เชิงวิชาการ',
    'รายงาน',
    'บทความ',
    'วิทยานิพนธ์',
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-semibold text-[#1E2923]">
          ระดับภาษา
        </label>
        <span className="text-xs text-[#5A655E]">
          ค่าเริ่มต้น: เชิงวิชาการ
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {styles.map((style) => {
          const isSelected = selectedStyle === style;
          return (
            <button
              key={style}
              type="button"
              onClick={() => onSelectStyle(style)}
              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#006241] text-white shadow-xs'
                  : 'bg-[#E2ECE5]/70 text-[#1E2923] hover:bg-[#E2ECE5] border border-[#DCE3DD]'
              }`}
            >
              {style}
            </button>
          );
        })}
      </div>
    </div>
  );
};
