import React from 'react';
import { Check } from 'lucide-react';

export const Hero: React.FC = () => {
  const chips = [
    'เทียบรูปแบบเอกสาร (Template)',
    'โครงสร้างและลำดับบท',
    'ตรวจคำสะกดและไวยากรณ์',
    'ปรับภาษาวิชาการ',
  ];

  return (
    <section className="pt-6 pb-4 sm:pt-10 sm:pb-6 text-center max-w-3xl mx-auto px-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1E2923] leading-snug">
        ตรวจงานเขียนและโครงสร้างเอกสารภาษาไทย
      </h1>
      <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-[#5A655E] max-w-xl mx-auto leading-relaxed">
        ตรวจสอบไวยากรณ์ คำสะกด และความถูกต้องของหัวข้อตามรูปแบบเอกสาร
      </p>

      {/* Feature Chips */}
      <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2">
        {chips.map((chip) => (
          <div
            key={chip}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E2ECE5] text-[#006241] border border-[#006241]/10 transition-all hover:bg-[#d4e4d8]"
          >
            <Check className="w-3.5 h-3.5 text-[#006241] stroke-[2.5]" />
            <span>{chip}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
