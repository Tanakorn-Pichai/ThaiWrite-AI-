import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DetailedBreakdown } from '../../types';

interface IssueAccordionProps {
  breakdown: DetailedBreakdown;
  activeFilter?: string | null;
}

export const IssueAccordion: React.FC<IssueAccordionProps> = ({
  breakdown,
  activeFilter,
}) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    grammar: true,
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const items = [
    {
      key: 'spelling',
      title: 'คำสะกด (Spelling)',
      color: 'bg-[#D9534F]',
      content: breakdown.spelling,
      example: 'เช่น "สัมนา" → "สัมมนา"',
    },
    {
      key: 'grammar',
      title: 'ไวยากรณ์ (Grammar)',
      color: 'bg-[#E5A83B]',
      content: breakdown.grammar,
      example: 'เช่น "ทำการวิเคราะห์" → "วิเคราะห์"',
    },
    {
      key: 'wordUsage',
      title: 'การใช้คำ (Word Usage)',
      color: 'bg-[#3182CE]',
      content: breakdown.wordUsage,
      example: 'เช่น "มีความต้องการที่จะ" → "ต้องการ"',
    },
    {
      key: 'academic',
      title: 'ภาษาวิชาการ (Academic Style)',
      color: 'bg-[#805AD5]',
      content: breakdown.academic,
      example: 'เช่น "เยอะแยะ" → "จำนวนมาก"',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs sm:text-sm font-semibold text-[#1E2923]">
          คำอธิบายรายหมวดหมู่
        </h3>
        <span className="text-[11px] text-[#5A655E]">คลิกเพื่อดูคำแนะนำ</span>
      </div>

      <div className="divide-y divide-[#DCE3DD] border border-[#DCE3DD] rounded-xl overflow-hidden bg-white">
        {items.map((item) => {
          const isOpen = activeFilter === item.key || !!openItems[item.key];

          return (
            <div key={item.key} className="transition-colors">
              <button
                type="button"
                onClick={() => toggleItem(item.key)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F4F6F4] transition-colors cursor-pointer"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`}
                  />
                  <span className="text-xs sm:text-sm font-medium text-[#1E2923]">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-[11px] text-[#5A655E]">
                    {item.example}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#5A655E] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#006241]' : ''
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-3.5 pt-1 text-xs text-[#5A655E] leading-relaxed bg-[#F4F6F4]/60 border-t border-[#DCE3DD]/60 animate-in fade-in">
                  <p>{item.content}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
