import React, { useState } from 'react';
import { Sparkles, History, BookOpen, User, Menu, X, CheckCheck } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenGuide,
  onOpenProfile,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#DCE3DD] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand lockup */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 text-decoration-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#006241] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <CheckCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2923]">
                    ThaiWrite AI
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E2ECE5] text-[#006241]">
                    <Sparkles className="w-3 h-3 text-[#006241]" />
                    NLP + Structure
                  </span>
                </div>
                <span className="hidden md:block text-xs text-[#5A655E] font-normal truncate max-w-md">
                  ตรวจไวยากรณ์และโครงสร้างงานเขียนภาษาไทย
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3.5 py-2 text-sm font-medium text-[#1E2923] hover:text-[#006241] hover:bg-[#E2ECE5]/60 rounded-lg transition-colors cursor-pointer"
            >
              หน้าแรก
            </button>
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#5A655E] hover:text-[#006241] hover:bg-[#E2ECE5]/60 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-[#006241]" />
              ประวัติ
            </button>
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#5A655E] hover:text-[#006241] hover:bg-[#E2ECE5]/60 rounded-lg transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#006241]" />
              คู่มือ
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={onOpenProfile}
              className="ml-2 flex items-center justify-center w-10 h-10 rounded-full bg-[#006241] text-white hover:bg-[#004d33] transition-all shadow-sm cursor-pointer"
              title="ข้อมูลผู้ใช้ / นักศึกษา"
              aria-label="โปรไฟล์นักศึกษา"
            >
              <User className="w-4.5 h-4.5" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-full bg-[#006241] text-white flex items-center justify-center shadow-xs"
              aria-label="โปรไฟล์นักศึกษา"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#1E2923] hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DCE3DD] bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <div className="pb-2 mb-2 border-b border-[#DCE3DD]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E2ECE5] text-[#006241]">
              <Sparkles className="w-3 h-3 text-[#006241]" />
              NLP + Structure
            </span>
            <p className="text-xs text-[#5A655E] mt-1.5">
              ตรวจไวยากรณ์และโครงสร้างงานเขียนภาษาไทย
            </p>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#1E2923] hover:bg-[#E2ECE5] rounded-lg transition-colors flex items-center gap-2"
          >
            หน้าแรก
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenHistory();
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#1E2923] hover:bg-[#E2ECE5] rounded-lg transition-colors flex items-center gap-2.5"
          >
            <History className="w-4 h-4 text-[#006241]" />
            ประวัติการตรวจ
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenGuide();
            }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#1E2923] hover:bg-[#E2ECE5] rounded-lg transition-colors flex items-center gap-2.5"
          >
            <BookOpen className="w-4 h-4 text-[#006241]" />
            คู่มือการใช้งาน
          </button>
        </div>
      )}
    </header>
  );
};
