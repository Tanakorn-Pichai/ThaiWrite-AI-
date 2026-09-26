import React, { useEffect } from 'react';
import { HistoryItem } from '../../types';
import { X, FileText, Calendar, Trash2, ArrowUpRight } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
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
      aria-labelledby="history-modal-title"
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
            <span className="text-xl">📜</span>
            <h3 id="history-modal-title" className="text-base sm:text-lg font-bold text-[#1E2923]">
              ประวัติการตรวจ
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5A655E] hover:text-[#1E2923] hover:bg-[#E2ECE5] rounded-lg transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-[#5A655E] text-sm">
              ยังไม่มีประวัติการตรวจ
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectHistoryItem(item)}
                className="p-3.5 sm:p-4 rounded-xl border border-[#DCE3DD] hover:border-[#006241]/50 hover:bg-[#F4F6F4]/50 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#006241] shrink-0" />
                    <h4 className="text-sm font-semibold text-[#1E2923] truncate group-hover:text-[#006241] transition-colors">
                      {item.documentName}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-[#5A655E] flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#5A655E]" />
                      {item.date}
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      {item.wordCount.toLocaleString()} คำ
                    </span>
                    {item.writingStyle && (
                      <>
                        <span>·</span>
                        <span className="text-[#006241] font-medium">
                          {item.writingStyle}
                        </span>
                      </>
                    )}
                    {item.templateName && (
                      <>
                        <span>·</span>
                        <span className="text-[#006241] bg-[#E2ECE5] px-1.5 py-0.2 rounded text-[10px] font-medium truncate max-w-[130px]">
                          {item.templateName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#DCE3DD]">
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-[#E2ECE5] text-[#006241] border border-[#006241]/20">
                      ภาษา: {item.score}/100
                    </span>
                    {item.structureScore && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                        โครงสร้าง: {item.structureScore}/100
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[#006241] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    เปิด <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#DCE3DD] bg-[#F4F6F4] flex items-center justify-between">
          {history.length > 0 ? (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างประวัติ</span>
            </button>
          ) : (
            <div />
          )}

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
