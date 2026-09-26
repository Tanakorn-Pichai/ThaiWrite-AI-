import React, { useEffect } from 'react';
import { X, GraduationCap, Award, FileCheck, BookMarked, User } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalChecks: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  totalChecks,
}) => {
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
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#DCE3DD] shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="bg-[#006241] text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="ปิดโปรไฟล์"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center text-white shadow-xs">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 id="profile-modal-title" className="text-base font-bold">
                บัญชีผู้ใช้
              </h3>
              <p className="text-xs text-white/85 flex items-center gap-1 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5" />
                นิสิต / นักศึกษา
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F4F6F4] border border-[#DCE3DD] text-center">
              <span className="text-[11px] text-[#5A655E] font-medium flex items-center justify-center gap-1 mb-1">
                <FileCheck className="w-3.5 h-3.5 text-[#006241]" />
                เอกสารที่ตรวจแล้ว
              </span>
              <p className="text-xl font-bold font-mono text-[#1E2923] tabular-nums">
                {totalChecks} รายการ
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F6F4] border border-[#DCE3DD] text-center">
              <span className="text-[11px] text-[#5A655E] font-medium flex items-center justify-center gap-1 mb-1">
                <Award className="w-3.5 h-3.5 text-[#E5A83B]" />
                คะแนนเฉลี่ย
              </span>
              <p className="text-xl font-bold font-mono text-[#006241] tabular-nums">
                89.5 / 100
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#DCE3DD] bg-[#F4F6F4] text-xs text-[#5A655E] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1E2923]">สิทธิ์ใช้งาน:</span>
              <span className="text-[#006241] font-medium bg-[#E2ECE5] px-2 py-0.5 rounded border border-[#006241]/10">
                Academic Tier
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1E2923]">โมเดลตรวจคำ:</span>
              <span className="font-mono">Thai NLP v2.4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1E2923]">เกณฑ์อ้างอิง:</span>
              <span>ราชบัณฑิตยสถาน</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#E2ECE5] border border-[#006241]/15 text-xs text-[#1E2923] flex items-start gap-2">
            <BookMarked className="w-4 h-4 text-[#006241] shrink-0 mt-0.5" />
            <p>
              ระบบบันทึกประวัติการตรวจสอบเพื่อช่วยให้คุณติดตามการพัฒนางานเขียนได้อย่างต่อเนื่อง
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DCE3DD] bg-[#F4F6F4] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#1E2923] hover:bg-[#E2ECE5] rounded-xl transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
