import React, { useEffect } from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const latestToast = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      onDismiss(latestToast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || !toast.type;
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              isError
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : isSuccess
                ? 'bg-[#E2ECE5] border-[#006241]/30 text-[#1E2923]'
                : 'bg-[#F4F6F4] border-[#DCE3DD] text-[#1E2923]'
            }`}
          >
            <div className="flex items-center gap-2.5 flex-1">
              {isError && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#006241] shrink-0" />}
              {!isError && !isWarning && !isSuccess && (
                <Info className="w-5 h-5 text-[#006241] shrink-0" />
              )}
              <span className="font-medium text-xs sm:text-sm leading-snug">{toast.text}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#5A655E] hover:text-[#1E2923] p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
