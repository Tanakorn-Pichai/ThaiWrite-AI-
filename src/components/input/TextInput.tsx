import React, { forwardRef } from 'react';
import { Trash2, Zap } from 'lucide-react';

interface TextInputProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onUseSample?: () => void;
  maxLength?: number;
}

export const TextInput = forwardRef<HTMLTextAreaElement, TextInputProps>(
  ({ value, onChange, onClear, onUseSample, maxLength = 20000 }, ref) => {
    const count = value.length;
    const isNearLimit = count > maxLength * 0.9;
    const isAtLimit = count >= maxLength;

    return (
      <div className="flex flex-col gap-2">
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= maxLength) {
                onChange(e.target.value);
              }
            }}
            placeholder="พิมพ์หรือวางข้อความภาษาไทยที่นี่..."
            rows={7}
            className={`w-full p-4 rounded-xl border bg-white text-[#1E2923] text-sm sm:text-base leading-relaxed placeholder:text-[#828F86] focus:outline-none focus:ring-2 focus:ring-[#006241] focus:border-transparent transition-all resize-y min-h-[160px] ${
              isAtLimit
                ? 'border-rose-400 focus:ring-rose-400'
                : 'border-[#DCE3DD] hover:border-[#006241]/50'
            }`}
          />
        </div>

        {/* Action buttons and character counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#5A655E]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              disabled={!value}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#5A655E] hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้าง</span>
            </button>

            <button
              type="button"
              onClick={onUseSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#006241] bg-[#E2ECE5] hover:bg-[#d5e4d9] transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#006241]" />
              <span>ข้อความตัวอย่าง (ไม่ส่งผลตรวจจนกดตรวจ)</span>
            </button>
          </div>

          <div
            className={`font-mono text-xs tabular-nums ${
              isAtLimit
                ? 'text-rose-600 font-semibold'
                : isNearLimit
                ? 'text-amber-600'
                : 'text-[#828F86]'
            }`}
          >
            <span>{count.toLocaleString()}</span> / {maxLength.toLocaleString()} ตัวอักษร
          </div>
        </div>
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
