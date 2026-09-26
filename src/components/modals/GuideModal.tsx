import React, { useEffect } from 'react';
import { GUIDE_STEPS } from '../../data/mockGuide';
import { X, CheckCircle, Lightbulb } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#DCE3DD] shadow-xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DCE3DD] bg-[#F4F6F4]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📖</span>
            <h3 id="guide-modal-title" className="text-base sm:text-lg font-bold text-[#1E2923]">
              คู่มือการใช้งาน
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5A655E] hover:text-[#1E2923] hover:bg-[#E2ECE5] rounded-lg transition-colors cursor-pointer"
            aria-label="ปิดคู่มือ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs sm:text-sm text-[#5A655E] leading-relaxed pb-1">
            ตรวจทานและยกระดับงานเขียนภาษาไทยใน 4 ขั้นตอน:
          </p>

          <div className="space-y-3">
            {GUIDE_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-3.5 sm:p-4 rounded-xl border border-[#DCE3DD] bg-[#FFFFFF] hover:border-[#006241]/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#006241] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#1E2923]">
                      {step.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#5A655E] mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                    {step.details && (
                      <div className="mt-2 text-xs text-[#1E2923] bg-[#E2ECE5] p-2.5 rounded-lg border border-[#006241]/15 flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#006241] shrink-0 mt-0.5" />
                        <span>{step.details}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>ข้อแนะนำ:</strong> การเขียนเชิงวิชาการควรหลีกเลี่ยงภาษาพูดและกริยาฟุ่มเฟือย เช่น &quot;ทำการ...&quot; เพื่อให้งานเขียนกระชับและน่าเชื่อถือ
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DCE3DD] bg-[#F4F6F4] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#006241] hover:bg-[#004d33] rounded-xl transition-colors cursor-pointer"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
