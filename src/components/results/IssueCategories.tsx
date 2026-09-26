import React from 'react';
import { CategoryCounts } from '../../types';

interface IssueCategoriesProps {
  categories: CategoryCounts;
  onFilterCategory?: (category: keyof CategoryCounts | null) => void;
  activeCategory?: keyof CategoryCounts | null;
}

export const IssueCategories: React.FC<IssueCategoriesProps> = ({
  categories,
  onFilterCategory,
  activeCategory,
}) => {
  const items: Array<{
    key: keyof CategoryCounts;
    label: string;
    dotColor: string;
    count: number;
    bgHover: string;
    borderColor: string;
  }> = [
    {
      key: 'spelling',
      label: 'คำสะกด',
      dotColor: 'bg-[#D9534F]',
      count: categories.spelling,
      bgHover: 'hover:bg-rose-50',
      borderColor: 'border-rose-200',
    },
    {
      key: 'grammar',
      label: 'ไวยากรณ์',
      dotColor: 'bg-[#E5A83B]',
      count: categories.grammar,
      bgHover: 'hover:bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      key: 'wordUsage',
      label: 'การใช้คำ',
      dotColor: 'bg-[#3182CE]',
      count: categories.wordUsage,
      bgHover: 'hover:bg-sky-50',
      borderColor: 'border-sky-200',
    },
    {
      key: 'academic',
      label: 'ภาษาวิชาการ',
      dotColor: 'bg-[#805AD5]',
      count: categories.academic,
      bgHover: 'hover:bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs sm:text-sm font-semibold text-[#1E2923]">
          หมวดหมู่ข้อผิดพลาด
        </h3>
        <span className="text-xs text-[#5A655E]">
          รวม {Object.values(categories).reduce((a, b) => a + b, 0)} จุด
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((item) => {
          const isActive = activeCategory === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onFilterCategory?.(isActive ? null : item.key)}
              className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                isActive
                  ? `bg-white ring-2 ring-[#006241] shadow-xs ${item.borderColor}`
                  : `bg-white border-[#DCE3DD] ${item.bgHover}`
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotColor}`}
                  aria-hidden="true"
                />
                <span className="text-xs sm:text-sm font-medium text-[#1E2923]">
                  {item.label}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-bold font-mono text-[#5A655E] tabular-nums">
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
