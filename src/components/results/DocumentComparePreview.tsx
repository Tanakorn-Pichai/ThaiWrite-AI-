import React, { useState } from 'react';
import {
  DocumentPreviewData,
  StructureResult,
  AnalysisResult,
  DocumentAnnotation,
  DocumentPageContent,
} from '../../types';
import {
  Download,
  FileText,
  ArrowLeft,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  MousePointer,
} from 'lucide-react';
import {
  exportDocumentAsPDF,
  exportDocumentAsDocx,
  exportBothFormats,
} from '../../utils/documentExport';

interface DocumentComparePreviewProps {
  previewData: DocumentPreviewData;
  analysisResult?: AnalysisResult | null;
  structureResult?: StructureResult | null;
  onDownloadFeedback?: (msg: string) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onBackToHome?: () => void;
}

export const DocumentComparePreview: React.FC<DocumentComparePreviewProps> = ({
  previewData,
  analysisResult,
  structureResult,
  onDownloadFeedback,
  isFullScreen = false,
  onToggleFullScreen,
  onBackToHome,
}) => {
  // View mode: 'split' (side-by-side), 'annotated' (reviewed only), 'original' (original only)
  const [viewMode, setViewMode] = useState<'annotated' | 'original' | 'split'>('split');
  
  // Current active page: 1 to totalPages, and last page is the Comments Sheet (หน้าแยกของเอกสาร)
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Zoom scale: 80% to 120%
  const [zoomScale, setZoomScale] = useState<number>(100);

  // Export format selection
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'both'>('both');

  const totalContentPages = previewData.pages.length;
  // Total pages including the separate comments sheet (หน้าแยกของเอกสาร)
  const totalTotalPages = totalContentPages + 1;
  const isCommentsSheet = currentPage === totalTotalPages;

  // Collect all annotations with their sequential reference numbers
  const allAnnotations: DocumentAnnotation[] = previewData.pages.flatMap((page) =>
    page.annotatedParagraphs.flatMap((p) => p.annotations)
  );

  const handleDownload = () => {
    if (exportFormat === 'pdf') {
      exportDocumentAsPDF(previewData, analysisResult, structureResult);
      onDownloadFeedback?.('ดาวน์โหลดไฟล์ PDF สำเร็จ');
    } else if (exportFormat === 'docx') {
      exportDocumentAsDocx(previewData, analysisResult, structureResult);
      onDownloadFeedback?.('ดาวน์โหลดไฟล์ Word (.docx) สำเร็จ');
    } else {
      exportBothFormats(previewData, analysisResult, structureResult);
      onDownloadFeedback?.('ดาวน์โหลดทั้งไฟล์ PDF และ Word (.docx) สำเร็จ');
    }
  };

  /**
   * Render annotated text:
   * 1. Highlight is non-clickable (ไม่ต้องกดได้)
   * 2. Small numerical marker above highlight [1], [2], ...
   * 3. Will never overflow or break layout
   */
  const renderAnnotatedText = (text: string, annotations: DocumentAnnotation[]) => {
    if (!annotations || annotations.length === 0) {
      return <span>{text}</span>;
    }

    let remaining = text;
    const elements: React.ReactNode[] = [];
    let keyIdx = 0;

    const sortedAnnotations = [...annotations].sort((a, b) => {
      const idxA = text.indexOf(a.originalText);
      const idxB = text.indexOf(b.originalText);
      return idxA - idxB;
    });

    sortedAnnotations.forEach((ann, idx) => {
      const targetIdx = remaining.indexOf(ann.originalText);
      if (targetIdx !== -1) {
        if (targetIdx > 0) {
          elements.push(
            <span key={`txt-${keyIdx++}`}>
              {remaining.substring(0, targetIdx)}
            </span>
          );
        }

        const isWord = ann.type === 'word';
        const markerNumber = ann.number || idx + 1;

        elements.push(
          <span
            key={`ann-${ann.id}`}
            className="relative inline-block mx-1 my-1.5 align-baseline"
          >
            {/* Small numerical badge positioned directly ABOVE the highlight */}
            <span
              className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold leading-none select-none z-10 shadow-2xs ${
                isWord
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#006241] text-white'
              }`}
              title={`ข้อคิดเห็น [${markerNumber}] ดูรายละเอียดที่หน้าแยกบันทึกข้อคิดเห็น`}
            >
              {markerNumber}
            </span>

            {/* Non-clickable Highlighted text with soft underline */}
            <mark
              className={`px-1.5 py-0.5 rounded font-medium select-text cursor-default ${
                isWord
                  ? 'bg-rose-100 text-[#1E2923] border-b-2 border-rose-500'
                  : 'bg-emerald-100 text-[#1E2923] border-b-2 border-[#006241]'
              }`}
            >
              {ann.originalText}
            </mark>
          </span>
        );

        remaining = remaining.substring(targetIdx + ann.originalText.length);
      }
    });

    if (remaining.length > 0) {
      elements.push(<span key={`txt-end`}>{remaining}</span>);
    }

    return elements;
  };

  /**
   * Standard A4 Paper Component for a single page
   * Standard A4 ratio: 210mm x 297mm in fullscreen mode,
   * Compact balanced preview in embedded normal mode (ไม่ยาวจนเกินพอดี)
   */
  const renderA4Sheet = (
    page: DocumentPageContent,
    type: 'original' | 'annotated'
  ) => {
    return (
      <div
        key={`page-${page.pageNumber}-${type}`}
        className={`w-full bg-white rounded-xl border border-[#DCE3DD] mx-auto flex flex-col justify-between font-['Prompt',sans-serif] relative select-text transition-all animate-in fade-in duration-200 ${
          isFullScreen
            ? 'max-w-[720px] min-h-[920px] sm:min-h-[980px] p-7 sm:p-12 sm:pt-14 sm:pb-12 shadow-md'
            : 'max-w-full min-h-[220px] max-h-[380px] p-4 sm:p-5 shadow-xs'
        }`}
        style={{
          boxShadow: isFullScreen
            ? '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)'
            : '0 2px 8px -1px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Standard Page Running Header */}
        <div className="border-b border-slate-200/80 pb-2 mb-3 flex items-center justify-between text-[11px] text-[#5A655E] select-none">
          <span className="truncate max-w-[260px] font-medium text-[#1E2923]">
            {type === 'annotated'
              ? `ฉบับตรวจแก้: ${previewData.documentName}`
              : `ต้นฉบับเดิม: ${previewData.documentName}`}
          </span>
          <span className="font-mono text-[#006241] font-semibold bg-[#E2ECE5]/70 px-2 py-0.5 rounded text-[10px]">
            หน้า {page.pageNumber}
          </span>
        </div>

        {/* Standard Page Body Content */}
        <div
          className={`flex-1 break-words ${
            isFullScreen
              ? 'space-y-6 text-xs sm:text-sm text-[#1E2923] leading-loose'
              : 'space-y-2.5 text-xs text-[#1E2923] leading-relaxed overflow-y-auto max-h-[250px] pr-1.5'
          }`}
        >
          {type === 'annotated' ? (
            page.annotatedParagraphs.map((p) => (
              <p key={p.id}>
                {renderAnnotatedText(p.text, p.annotations)}
              </p>
            ))
          ) : (
            <div className="whitespace-pre-line leading-relaxed">
              {page.originalText}
            </div>
          )}
        </div>

        {/* Standard Page Footer */}
        <div className="border-t border-slate-100 pt-2 mt-3 flex items-center justify-between text-[10px] text-[#828F86] select-none">
          <span>{isFullScreen ? 'ขนาดกระดาษมาตรฐาน A4 (210 x 297 มม.)' : 'ตัวอย่างหน้าเอกสาร (Preview)'}</span>
          <span className="font-mono">หน้าที่ {page.pageNumber} จาก {totalTotalPages}</span>
        </div>
      </div>
    );
  };

  /**
   * Component for PAGE SEPARATE: REVIEW COMMENTS SHEET (หน้าแยกของเอกสาร)
   * Rendered as a Standard A4 Paper Sheet in fullscreen, compact in preview
   */
  const renderA4CommentsSheet = () => (
    <div
      key="page-comments-sheet"
      className={`w-full bg-white rounded-xl border border-[#006241]/30 mx-auto flex flex-col justify-between font-['Prompt',sans-serif] relative select-text transition-all animate-in fade-in duration-200 ${
        isFullScreen
          ? 'max-w-[720px] min-h-[920px] sm:min-h-[980px] p-7 sm:p-12 sm:pt-14 sm:pb-12 shadow-md'
          : 'max-w-full min-h-[220px] max-h-[380px] p-4 sm:p-5 shadow-xs'
      }`}
      style={{
        boxShadow: isFullScreen
          ? '0 4px 20px -2px rgba(0, 98, 65, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)'
          : '0 2px 8px -1px rgba(0, 98, 65, 0.04)',
      }}
    >
      {/* Running Header */}
      <div>
        <div className="border-b border-[#006241]/20 pb-2 mb-3 flex items-center justify-between text-[11px] text-[#5A655E] select-none">
          <div className="flex items-center gap-1.5 font-bold text-[#006241]">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>บันทึกข้อคิดเห็น (Comments Sheet)</span>
          </div>
          <span className="font-mono text-[#006241] font-semibold bg-[#E2ECE5] px-2 py-0.5 rounded text-[10px]">
            หน้า {totalTotalPages}
          </span>
        </div>

        {/* Header Summary Box */}
        <div className="p-2.5 rounded-lg bg-[#F4F6F4] border border-[#DCE3DD] mb-3 flex items-center justify-between gap-2 text-xs">
          <div>
            <h4 className="font-bold text-[#1E2923]">
              ข้อคิดเห็นทั้งหมด ({allAnnotations.length} จุด)
            </h4>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              คำผิด: {previewData.totalWordErrors}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#E2ECE5] border border-[#006241]/20 text-[#006241] font-semibold">
              โครงสร้าง: {previewData.totalStructureErrors}
            </span>
          </div>
        </div>

        {/* List of comments */}
        <div className={`space-y-2.5 ${!isFullScreen ? 'max-h-[220px] overflow-y-auto pr-1' : ''}`}>
          {allAnnotations.map((ann, idx) => {
            const num = ann.number || idx + 1;
            const isWord = ann.type === 'word';

            return (
              <div
                key={ann.id}
                className="p-2.5 rounded-lg border border-[#DCE3DD] bg-white space-y-1 text-xs hover:border-[#006241]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold text-white shrink-0 ${
                        isWord ? 'bg-rose-600' : 'bg-[#006241]'
                      }`}
                    >
                      {num}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                        isWord
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-[#E2ECE5] text-[#006241] border border-[#006241]/20'
                      }`}
                    >
                      {isWord ? 'คำผิด' : 'โครงสร้าง'}
                    </span>
                  </div>

                  <span className="text-[9px] text-[#5A655E] font-mono">
                    [{num}]
                  </span>
                </div>

                {/* Detected vs Suggestion */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-0.5">
                  <div className="p-1 rounded bg-rose-50/60 border border-rose-100">
                    <span className="font-semibold text-rose-950 truncate block">
                      "{ann.originalText}"
                    </span>
                  </div>

                  {ann.suggestedText && (
                    <div className="p-1 rounded bg-emerald-50/60 border border-emerald-100">
                      <span className="font-bold text-[#006241] truncate block">
                        "{ann.suggestedText}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed Rationale */}
                <div className="text-[10px] text-[#5A655E] leading-snug">
                  {ann.comment}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 pt-2 mt-3 flex items-center justify-between text-[10px] text-[#828F86] select-none">
        <span>หน้าแยกบันทึกข้อคิดเห็น (Review Comments Sheet)</span>
        <span className="font-mono">หน้าที่ {totalTotalPages} จาก {totalTotalPages}</span>
      </div>
    </div>
  );

  // =========================================================================
  // CASE 1: FULL SCREEN MODE (เฉพาะในหน้านี้เท่านั้น)
  // Transparent overlays floating on top of the document until mouse hover!
  // =========================================================================
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-[#E5ECE7] overflow-hidden flex flex-col select-none">
        {/* ------------------------------------------------------------- */}
        {/* FLOATING TOP BAR (โปร่งใสทับเอกสาร จนกว่าจะเอาเมาส์เลื่อนไป)    */}
        {/* ------------------------------------------------------------- */}
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl pointer-events-auto">
          <div className="bg-white/40 hover:bg-white/95 backdrop-blur-md hover:backdrop-blur-lg border border-white/50 hover:border-[#006241]/30 shadow-md hover:shadow-2xl rounded-2xl p-2 sm:px-4 sm:py-2.5 transition-all duration-300 opacity-40 hover:opacity-100 group">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Left: Back button & Document Title */}
              <div className="flex items-center gap-2 min-w-0">
                {onBackToHome && (
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-[#006241] text-[#1E2923] hover:text-white border border-[#DCE3DD] hover:border-[#006241] text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
                    title="กลับไปหน้าหลัก"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>กลับไปหน้าหลัก</span>
                  </button>
                )}

                <div className="w-7 h-7 rounded-lg bg-[#006241] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>

                <div className="truncate max-w-[180px] sm:max-w-[240px]">
                  <span className="text-[10px] text-[#5A655E] block leading-none">
                    พรีวิวเต็มหน้า A4
                  </span>
                  <span className="text-xs font-bold text-[#1E2923] truncate block">
                    {previewData.documentName}
                  </span>
                </div>
              </div>

              {/* Center: View Mode & Click-To-Change Page Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-0.5 p-0.5 bg-white/80 rounded-lg border border-[#DCE3DD] text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('annotated')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      viewMode === 'annotated'
                        ? 'bg-[#006241] text-white shadow-2xs font-semibold'
                        : 'text-[#5A655E] hover:text-[#1E2923]'
                    }`}
                  >
                    ฉบับตรวจแก้
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('original')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      viewMode === 'original'
                        ? 'bg-[#006241] text-white shadow-2xs font-semibold'
                        : 'text-[#5A655E] hover:text-[#1E2923]'
                    }`}
                  >
                    ต้นฉบับเดิม
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-[#006241] text-white shadow-2xs font-semibold'
                        : 'text-[#5A655E] hover:text-[#1E2923]'
                    }`}
                  >
                    เทียบ 2 ฝั่ง
                  </button>
                </div>

                {/* Page Selector Dropdown */}
                <div className="flex items-center gap-1 p-0.5 bg-white/90 rounded-xl border border-[#DCE3DD] text-xs shadow-2xs">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1 rounded-lg text-[#5A655E] hover:text-[#006241] hover:bg-[#E2ECE5] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative">
                    <select
                      value={currentPage}
                      onChange={(e) => setCurrentPage(Number(e.target.value))}
                      className="appearance-none bg-transparent pl-2.5 pr-6 py-1 text-xs font-semibold text-[#1E2923] cursor-pointer focus:outline-none"
                      aria-label="เลือกหน้าเอกสาร"
                    >
                      {previewData.pages.map((p) => (
                        <option key={`top-opt-${p.pageNumber}`} value={p.pageNumber}>
                          หน้า {p.pageNumber} / {totalTotalPages}
                        </option>
                      ))}
                      <option value={totalTotalPages}>
                        📑 หน้าบันทึกข้อคิดเห็น (หน้า {totalTotalPages})
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#5A655E] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalTotalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalTotalPages))}
                    className="p-1 rounded-lg text-[#5A655E] hover:text-[#006241] hover:bg-[#E2ECE5] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                    title="หน้าถัดไป"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right: Zoom controls & Minimize toggle */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 p-0.5 bg-white/80 rounded-lg border border-[#DCE3DD] text-xs">
                  <button
                    type="button"
                    onClick={() => setZoomScale((z) => Math.max(z - 10, 70))}
                    title="ย่อขนาด"
                    className="p-1 text-[#5A655E] hover:text-[#1E2923] cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1 font-semibold text-[#1E2923]">
                    {zoomScale}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((z) => Math.min(z + 10, 130))}
                    title="ขยายขนาด"
                    className="p-1 text-[#5A655E] hover:text-[#1E2923] cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {onToggleFullScreen && (
                  <button
                    type="button"
                    onClick={onToggleFullScreen}
                    title="ย่อกลับมุมมองแบ่งช่อง"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-[#E2ECE5] border border-[#DCE3DD] hover:border-[#006241] text-[#006241] transition-colors cursor-pointer text-xs font-semibold shadow-2xs"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ย่อ</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hover Indicator tooltip at bottom of top bar */}
            <div className="text-[10px] text-center text-[#5A655E] group-hover:opacity-0 transition-opacity pointer-events-none mt-1">
              <span className="bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/60 shadow-2xs inline-flex items-center gap-1">
                <MousePointer className="w-3 h-3 text-[#006241]" />
                เลื่อนเมาส์มาที่นี่เพื่อดูเครื่องมือควบคุมและเปลี่ยนหน้า
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DOCUMENT VIEWPORT: PURE 100% FULL SCREEN A4 CANVAS            */}
        {/* ------------------------------------------------------------- */}
        <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden flex items-start justify-center p-3 sm:p-6 pt-20 pb-24">
          <div
            className="w-full flex justify-center transition-transform duration-200"
            style={{
              transform: `scale(${zoomScale / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {viewMode === 'split' ? (
              /* Split View: Side-by-side full page */
              <div className="w-full max-w-[1440px] grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Page (Original) */}
                <div className="space-y-2">
                  <div className="bg-[#E5ECE7]/90 py-1 px-3 rounded-lg border border-[#DCE3DD] flex items-center justify-between text-xs font-semibold text-[#5A655E]">
                    <span>ต้นฉบับเดิม (Original)</span>
                    <span>มาตรฐาน A4 - หน้า {currentPage}</span>
                  </div>

                  {!isCommentsSheet ? (
                    renderA4Sheet(previewData.pages[currentPage - 1], 'original')
                  ) : (
                    <div className="w-full max-w-[720px] min-h-[920px] sm:min-h-[980px] bg-white/70 rounded-xs border border-dashed border-[#DCE3DD] flex flex-col items-center justify-center text-[#5A655E] text-xs p-8 text-center mx-auto">
                      <FileSpreadsheet className="w-8 h-8 text-[#006241]/50 mb-2" />
                      <p className="font-semibold text-[#1E2923]">หน้าบันทึกข้อคิดเห็นและรายการตรวจแก้</p>
                      <p className="text-[11px] mt-1 text-[#5A655E]">
                        (ตารางรายละเอียดข้อคิดเห็นและการปรับปรุงจะปรากฏที่ฝั่งขวา)
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Page (Reviewed or Comments) */}
                <div className="space-y-2">
                  <div className="bg-[#E5ECE7]/90 py-1 px-3 rounded-lg border border-[#006241]/30 flex items-center justify-between text-xs font-semibold text-[#006241]">
                    <span>
                      {isCommentsSheet
                        ? 'หน้าบันทึกข้อคิดเห็น (Comments Sheet)'
                        : 'ฉบับตรวจแก้พร้อมหมายเลขกำกับ (Reviewed)'}
                    </span>
                    <span>มาตรฐาน A4 - หน้า {currentPage}</span>
                  </div>

                  {!isCommentsSheet ? (
                    renderA4Sheet(previewData.pages[currentPage - 1], 'annotated')
                  ) : (
                    renderA4CommentsSheet()
                  )}
                </div>
              </div>
            ) : (
              /* Single Page Mode */
              <div className="w-full max-w-3xl">
                <div className="bg-[#E5ECE7]/90 py-1 px-3 mb-2 rounded-lg border border-[#DCE3DD] flex items-center justify-between text-xs font-semibold text-[#1E2923]">
                  <span>
                    {isCommentsSheet
                      ? 'หน้าบันทึกข้อคิดเห็นและรายการตรวจแก้'
                      : viewMode === 'annotated'
                      ? 'ฉบับตรวจแก้พร้อมหมายเลขกำกับ'
                      : 'ต้นฉบับเดิม'}
                  </span>
                  <span>มาตรฐาน A4 - หน้า {currentPage} / {totalTotalPages}</span>
                </div>

                {!isCommentsSheet ? (
                  renderA4Sheet(previewData.pages[currentPage - 1], viewMode)
                ) : (
                  renderA4CommentsSheet()
                )}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FLOATING BOTTOM BAR (โปร่งใสทับเอกสาร จนกว่าจะเอาเมาส์เลื่อนไป) */}
        {/* ------------------------------------------------------------- */}
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl pointer-events-auto">
          <div className="bg-white/45 hover:bg-white/95 backdrop-blur-md hover:backdrop-blur-lg border border-white/50 hover:border-[#006241]/30 shadow-lg hover:shadow-2xl rounded-2xl px-4 py-2 sm:px-5 sm:py-2.5 transition-all duration-300 opacity-40 hover:opacity-100 group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-[#006241] text-[#1E2923] hover:text-white border border-[#DCE3DD] hover:border-[#006241] disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs font-semibold transition-all shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>ก่อนหน้า</span>
                </button>

                <div className="relative">
                  <select
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="appearance-none bg-white/90 rounded-lg border border-[#DCE3DD] hover:border-[#006241] pl-3 pr-7 py-1 text-xs font-bold text-[#1E2923] cursor-pointer focus:outline-none shadow-2xs"
                    aria-label="เลือกหน้าเอกสาร"
                  >
                    {previewData.pages.map((p) => (
                      <option key={`bottom-opt-${p.pageNumber}`} value={p.pageNumber}>
                        หน้า {p.pageNumber} / {totalTotalPages}
                      </option>
                    ))}
                    <option value={totalTotalPages}>
                      📑 หน้าบันทึกข้อคิดเห็น
                    </option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5A655E] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalTotalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalTotalPages))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-[#006241] text-[#1E2923] hover:text-white border border-[#DCE3DD] hover:border-[#006241] disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs font-semibold transition-all shadow-2xs"
                >
                  <span>ถัดไป</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Format selection & Download Button */}
              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <div className="flex items-center gap-1 text-[11px]">
                  <label
                    className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                      exportFormat === 'pdf'
                        ? 'bg-[#006241] text-white border-[#006241] font-semibold'
                        : 'bg-white/80 border-[#DCE3DD] text-[#5A655E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fsExportFormat"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={() => setExportFormat('pdf')}
                      className="sr-only"
                    />
                    <span>PDF</span>
                  </label>

                  <label
                    className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                      exportFormat === 'docx'
                        ? 'bg-[#006241] text-white border-[#006241] font-semibold'
                        : 'bg-white/80 border-[#DCE3DD] text-[#5A655E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fsExportFormat"
                      value="docx"
                      checked={exportFormat === 'docx'}
                      onChange={() => setExportFormat('docx')}
                      className="sr-only"
                    />
                    <span>Word</span>
                  </label>

                  <label
                    className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                      exportFormat === 'both'
                        ? 'bg-[#006241] text-white border-[#006241] font-semibold'
                        : 'bg-white/80 border-[#DCE3DD] text-[#5A655E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fsExportFormat"
                      value="both"
                      checked={exportFormat === 'both'}
                      onChange={() => setExportFormat('both')}
                      className="sr-only"
                    />
                    <span>ทั้ง 2 ไฟล์</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="py-1.5 px-3.5 rounded-lg bg-[#006241] hover:bg-[#004d33] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: NORMAL EMBEDDED MODE (อยู่ในหน้าหลักแบบปกติ ไม่ใช่หน้าแยกเต็มจอ)
  // Standard card component
  // =========================================================================
  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Top Header & Page Navigation Controls */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-[#006241]/20 bg-[#F4F6F4] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#006241] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-4 h-4 text-white" />
            </div>

            <div className="truncate">
              <span className="text-[10px] font-semibold text-[#5A655E] uppercase block">
                พรีวิวเอกสาร (มาตรฐาน A4)
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#1E2923] truncate">
                {previewData.documentName}
              </h3>
            </div>
          </div>

          {/* Action Row: Mode Toggles, Zoom & Fullscreen */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#DCE3DD] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('annotated')}
                className={`px-2.5 py-1.5 rounded font-medium transition-all cursor-pointer ${
                  viewMode === 'annotated'
                    ? 'bg-[#006241] text-white shadow-2xs font-semibold'
                    : 'text-[#5A655E] hover:text-[#1E2923]'
                }`}
              >
                ฉบับตรวจแก้
              </button>
              <button
                type="button"
                onClick={() => setViewMode('original')}
                className={`px-2.5 py-1.5 rounded font-medium transition-all cursor-pointer ${
                  viewMode === 'original'
                    ? 'bg-[#006241] text-white shadow-2xs font-semibold'
                    : 'text-[#5A655E] hover:text-[#1E2923]'
                }`}
              >
                ต้นฉบับเดิม
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1.5 rounded font-medium transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-[#006241] text-white shadow-2xs font-semibold'
                    : 'text-[#5A655E] hover:text-[#1E2923]'
                }`}
              >
                เทียบ 2 ฝั่ง
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#DCE3DD] text-xs">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(z - 10, 80))}
                title="ย่อขนาด"
                className="p-1.5 text-[#5A655E] hover:text-[#1E2923] cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1 font-semibold text-[#1E2923]">
                {zoomScale}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(z + 10, 120))}
                title="ขยายขนาด"
                className="p-1.5 text-[#5A655E] hover:text-[#1E2923] cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            {onToggleFullScreen && (
              <button
                type="button"
                onClick={onToggleFullScreen}
                title="ขยายเต็มหน้าจอ"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE3DD] hover:border-[#006241] text-[#006241] hover:bg-[#E2ECE5] transition-colors cursor-pointer text-xs font-medium shadow-2xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เต็มหน้า</span>
              </button>
            )}
          </div>
        </div>

        {/* CLICK-TO-CHANGE PAGE TOOLBAR (DROPDOWN) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#DCE3DD] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#5A655E] font-medium">เลือกหน้า:</span>
            <div className="relative">
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="appearance-none bg-white border border-[#DCE3DD] hover:border-[#006241] rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-[#1E2923] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006241]/20 shadow-2xs"
                aria-label="เลือกหน้าเอกสาร"
              >
                {previewData.pages.map((p) => (
                  <option key={`normal-opt-${p.pageNumber}`} value={p.pageNumber}>
                    หน้า {p.pageNumber} / {totalTotalPages}
                  </option>
                ))}
                <option value={totalTotalPages}>
                  📑 หน้าบันทึกข้อคิดเห็น (หน้า {totalTotalPages})
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A655E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE3DD] text-[#1E2923] hover:border-[#006241] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shadow-2xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">ก่อนหน้า</span>
            </button>

            <div className="px-3 py-1 bg-white rounded-lg border border-[#DCE3DD] font-mono text-xs font-bold text-[#1E2923]">
              หน้า {currentPage} / {totalTotalPages}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalTotalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalTotalPages))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE3DD] text-[#1E2923] hover:border-[#006241] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shadow-2xs font-medium"
            >
              <span className="hidden sm:inline text-xs">ถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DOCUMENT VIEWER WORKSPACE (COMPACT PREVIEW) */}
      <div className="w-full rounded-2xl bg-[#E8EFEA] border border-[#DCE3DD] p-3 sm:p-4 shadow-inner flex flex-col items-center">
        {viewMode === 'split' ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
            <div className="space-y-2">
              <div className="bg-[#E8EFEA] py-1 px-2.5 rounded-lg border border-[#DCE3DD] flex items-center justify-between text-[11px] font-semibold text-[#5A655E]">
                <span>ต้นฉบับเดิม (Original)</span>
                <span>หน้า {currentPage}</span>
              </div>

              {!isCommentsSheet ? (
                renderA4Sheet(previewData.pages[currentPage - 1], 'original')
              ) : (
                <div className="w-full min-h-[220px] max-h-[380px] bg-white/70 rounded-lg border border-dashed border-[#DCE3DD] flex flex-col items-center justify-center text-[#5A655E] text-xs p-6 text-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6 text-[#006241]/50 mb-1.5" />
                  <p className="font-semibold text-[#1E2923] text-xs">หน้าบันทึกข้อคิดเห็น</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="bg-[#E8EFEA] py-1 px-2.5 rounded-lg border border-[#006241]/30 flex items-center justify-between text-[11px] font-semibold text-[#006241]">
                <span>
                  {isCommentsSheet
                    ? 'หน้าบันทึกข้อคิดเห็น (Comments Sheet)'
                    : 'ฉบับตรวจแก้พร้อมหมายเลขกำกับ'}
                </span>
                <span>หน้า {currentPage}</span>
              </div>

              {!isCommentsSheet ? (
                renderA4Sheet(previewData.pages[currentPage - 1], 'annotated')
              ) : (
                renderA4CommentsSheet()
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            <div className="bg-[#E8EFEA] py-1 px-2.5 mb-2 rounded-lg border border-[#DCE3DD] flex items-center justify-between text-[11px] font-semibold text-[#1E2923]">
              <span>
                {isCommentsSheet
                  ? 'หน้าบันทึกข้อคิดเห็นและรายการตรวจแก้'
                  : viewMode === 'annotated'
                  ? 'ฉบับตรวจแก้พร้อมหมายเลขกำกับ'
                  : 'ต้นฉบับเดิม'}
              </span>
              <span>หน้า {currentPage} / {totalTotalPages}</span>
            </div>

            {!isCommentsSheet ? (
              renderA4Sheet(previewData.pages[currentPage - 1], viewMode)
            ) : (
              renderA4CommentsSheet()
            )}
          </div>
        )}

        {/* Callout button to view full screen */}
        {onToggleFullScreen && (
          <div className="mt-3 w-full p-2.5 rounded-xl bg-white/95 border border-[#006241]/30 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#006241] min-w-0">
              <Maximize2 className="w-4 h-4 shrink-0 text-[#006241]" />
              <span className="font-medium text-[#1E2923] truncate">
                แสดงตัวอย่างย่อ • กดเพื่อเปิดดูเอกสารแบบเต็มจอ A4 ทั้งหน้า
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleFullScreen}
              className="px-3 py-1.5 rounded-lg bg-[#006241] hover:bg-[#004d33] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 transition-transform active:scale-[0.98]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>เปิดดูเต็มหน้าจอ</span>
            </button>
          </div>
        )}
      </div>

      {/* Export & Download Action Bar */}
      <div className="p-4 rounded-xl border border-[#006241]/20 bg-[#FFFFFF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1E2923] flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#006241]" />
              <span>ดาวน์โหลดเอกสารผลการแก้ไข (ครบทุกหน้ามาตรฐาน)</span>
            </h4>
            <p className="text-[11px] text-[#5A655E] mt-0.5">
              หน้า 1 - {totalContentPages} เนื้อหาเอกสารพร้อมตัวเลขกำกับ + หน้า {totalTotalPages} หน้าบันทึกข้อคิดเห็น
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
                exportFormat === 'pdf'
                  ? 'bg-[#E2ECE5] border-[#006241] text-[#006241] font-semibold'
                  : 'bg-white border-[#DCE3DD] text-[#5A655E] hover:border-[#006241]/40'
              }`}
            >
              <input
                type="radio"
                name="normalExportFormat"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={() => setExportFormat('pdf')}
                className="sr-only"
              />
              <span>PDF (.pdf)</span>
            </label>

            <label
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
                exportFormat === 'docx'
                  ? 'bg-[#E2ECE5] border-[#006241] text-[#006241] font-semibold'
                  : 'bg-white border-[#DCE3DD] text-[#5A655E] hover:border-[#006241]/40'
              }`}
            >
              <input
                type="radio"
                name="normalExportFormat"
                value="docx"
                checked={exportFormat === 'docx'}
                onChange={() => setExportFormat('docx')}
                className="sr-only"
              />
              <span>Word (.docx)</span>
            </label>

            <label
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
                exportFormat === 'both'
                  ? 'bg-[#E2ECE5] border-[#006241] text-[#006241] font-semibold'
                  : 'bg-white border-[#DCE3DD] text-[#5A655E] hover:border-[#006241]/40'
              }`}
            >
              <input
                type="radio"
                name="normalExportFormat"
                value="both"
                checked={exportFormat === 'both'}
                onChange={() => setExportFormat('both')}
                className="sr-only"
              />
              <span>ทั้ง 2 ไฟล์</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-3 px-5 rounded-xl bg-[#006241] hover:bg-[#004d33] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>
            {exportFormat === 'pdf'
              ? 'ดาวน์โหลดไฟล์ PDF (.pdf) ครบทุกหน้า'
              : exportFormat === 'docx'
              ? 'ดาวน์โหลดไฟล์ Word (.docx) ครบทุกหน้า'
              : 'ดาวน์โหลดเอกสารทั้งสองไฟล์ (.pdf + .docx)'}
          </span>
        </button>
      </div>
    </div>
  );
};
