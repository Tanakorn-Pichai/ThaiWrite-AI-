import React from 'react';
import { CheckOptions, InputMode } from '../../types';
import { CheckSquare, SpellCheck, LayoutList, Layers } from 'lucide-react';

interface ScopeSelectorProps {
  options: CheckOptions;
  onChange: (options: CheckOptions) => void;
  inputMode: InputMode;
}

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  options,
  onChange,
  inputMode,
}) => {
  const toggleOption = (key: keyof CheckOptions) => {
    // Ensure at least one option stays checked
    const next = { ...options, [key]: !options[key] };
    if (!next.checkWords && !next.checkStructure && !next.compareTemplate) {
      return; // prevent all unchecking
    }
    onChange(next);
  };

  const scopes = [
    {
      key: 'checkWords' as const,
      label: 'ตรวจคำ / ไวยากรณ์',
      desc: 'คำสะกด ไวยากรณ์ การใช้คำ',
      icon: SpellCheck,
      checked: options.checkWords,
    },
    {
      key: 'checkStructure' as const,
      label: 'ตรวจโครงสร้าง',
      desc: 'ลำดับบท (เฉพาะไฟล์เอกสาร)',
      icon: LayoutList,
      checked: options.checkStructure,
    },
    {
      key: 'compareTemplate' as const,
      label: 'เทียบรูปแบบเอกสาร',
      desc: 'เทียบเกณฑ์ (เฉพาะไฟล์เอกสาร)',
      icon: Layers,
      checked: options.compareTemplate,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-bold text-[#1E2923] flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-[#006241]" />
          <span>1. เลือกสิ่งที่ต้องการตรวจสอบ (เลือกได้หลายแบบ)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {scopes.map((scope) => {
          const Icon = scope.icon;
          const isChecked = scope.checked;

          return (
            <button
              key={scope.key}
              type="button"
              onClick={() => toggleOption(scope.key)}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                isChecked
                  ? 'bg-[#E2ECE5]/50 border-[#006241] ring-2 ring-[#006241]/20 shadow-xs'
                  : 'bg-white border-[#DCE3DD] hover:border-[#006241]/40'
              }`}
            >
              <div
                className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${
                  isChecked
                    ? 'border-[#006241] bg-[#006241] text-white'
                    : 'border-[#DCE3DD] bg-white'
                }`}
              >
                {isChecked && (
                  <svg
                    className="w-3 h-3 text-white"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2.5 7.5 5.5 10.5 11.5 3.5" />
                  </svg>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isChecked ? 'text-[#006241]' : 'text-[#5A655E]'
                    }`}
                  />
                  <span className="text-xs font-bold text-[#1E2923]">
                    {scope.label}
                  </span>
                </div>
                <p className="text-[10px] text-[#5A655E] mt-0.5">
                  {scope.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
