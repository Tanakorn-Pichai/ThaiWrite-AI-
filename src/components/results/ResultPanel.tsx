import React, { useState } from 'react';
import {
  AnalysisResult,
  CategoryCounts,
  StructureResult,
  InputMode,
  CheckOptions,
  DocumentPreviewData,
} from '../../types';
import { SummaryStats } from './SummaryStats';
import { QualityScore } from './QualityScore';
import { IssueCategories } from './IssueCategories';
import { IssueRecommendation } from './IssueRecommendation';
import { ImprovedText } from './ImprovedText';
import { IssueAccordion } from './IssueAccordion';
import { StructurePanel } from './StructurePanel';
import { DocumentComparePreview } from './DocumentComparePreview';
import {
  Loader2,
  FileSearch,
  BookCheck,
  LayoutTemplate,
  FileText,
} from 'lucide-react';

interface ResultPanelProps {
  mode: InputMode;
  engineVersion?: string;
  checkOptions: CheckOptions;
  result: AnalysisResult | null;
  structureResult: StructureResult | null;
  documentPreviewData: DocumentPreviewData | null;
  isLoading: boolean;
  onApplyImprovement: () => void;
  onCopySuccess: () => void;
  onDownloadFeedback: (msg: string) => void;
  onOpenFullScreen?: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  mode,
  engineVersion,
  checkOptions,
  result,
  structureResult,
  documentPreviewData,
  isLoading,
  onApplyImprovement,
  onCopySuccess,
  onDownloadFeedback,
  onOpenFullScreen,
}) => {
  const [activeFileTab, setActiveFileTab] = useState<'preview' | 'structure'>('preview');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    keyof CategoryCounts | null
  >(null);

  const isFileMode = mode === 'file';

  return (
    <div className="bg-white rounded-2xl border border-[#DCE3DD] shadow-xs p-5 sm:p-6 flex flex-col justify-between min-h-[560px]">
      <div>
        {/* Header Bar */}
        <div className="pb-3.5 border-b border-[#DCE3DD] mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{isFileMode ? '📑' : '📊'}</span>
                <h2 className="text-lg sm:text-xl font-bold text-[#1E2923]">
                  {isFileMode ? 'ผลการตรวจเอกสาร' : 'ผลการตรวจคำและไวยากรณ์'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#5A655E] mt-0.5">
                {isFileMode
                  ? 'พรีวิวเทียบต้นฉบับกับฉบับตรวจแก้พร้อมข้อคิดเห็น'
                  : 'ผลการวิเคราะห์คำสะกด ไวยากรณ์ และปรับภาษาวิชาการ'}
              </p>
            </div>

            {/* Quick Score Badges */}
            {result && !isLoading && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {engineVersion && (
                  <div className="px-2.5 py-1.5 rounded-xl border border-[#006241]/20 bg-[#E2ECE5] text-[10px] text-[#006241] font-semibold">
                    FastAPI + PyThaiNLP · {engineVersion}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl border border-[#DCE3DD] bg-[#E2ECE5]/50 text-xs font-mono">
                    <span className="text-[10px] block font-sans text-[#006241] font-semibold">
                      คะแนนภาษา
                    </span>
                    <span className="text-sm font-bold text-[#006241]">
                      {result.score}/100
                    </span>
                  </div>

                  {isFileMode && structureResult && checkOptions.compareTemplate && (
                    <div className="px-3 py-1.5 rounded-xl border border-[#DCE3DD] bg-[#E2ECE5]/50 text-xs font-mono">
                      <span className="text-[10px] block font-sans text-[#006241] font-semibold">
                        คะแนนโครงสร้าง
                      </span>
                      <span className="text-sm font-bold text-[#006241]">
                        {structureResult.overallScore}/100
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sub Navigation Tabs for File Mode (พรีวิวเอกสาร vs รายงานโครงสร้าง) */}
          {isFileMode && result && !isLoading && checkOptions.compareTemplate && structureResult && (
            <div className="mt-3.5 flex items-center gap-1.5 p-1 bg-[#E2ECE5]/70 rounded-xl border border-[#DCE3DD]">
              <button
                type="button"
                onClick={() => setActiveFileTab('preview')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeFileTab === 'preview'
                    ? 'bg-white text-[#1E2923] shadow-xs font-bold'
                    : 'text-[#5A655E] hover:text-[#1E2923]'
                }`}
              >
                <FileText className="w-4 h-4 text-[#006241]" />
                <span>พรีวิวตรวจแก้เอกสาร</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFileTab('structure')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeFileTab === 'structure'
                    ? 'bg-white text-[#1E2923] shadow-xs font-bold'
                    : 'text-[#5A655E] hover:text-[#1E2923]'
                }`}
              >
                <LayoutTemplate className="w-4 h-4 text-[#006241]" />
                <span>รายงานตรวจรูปแบบเอกสาร</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic States */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center gap-3 animate-in fade-in">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-[#E2ECE5] flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-[#006241] animate-spin" />
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-[#1E2923]">
                กำลังตรวจสอบ...
              </p>
              <p className="text-xs text-[#5A655E] mt-1 max-w-sm mx-auto">
                {isFileMode
                  ? 'กำลังสร้างหน้าพรีวิวพร้อมไฮไลท์และข้อคิดเห็นตรวจแก้'
                  : 'ตรวจไวยากรณ์ คำสะกด และวิเคราะห์ภาษาธรรมชาติ (NLP)'}
              </p>
            </div>
          </div>
        ) : !result ? (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3 text-[#5A655E]">
            <div className="w-14 h-14 rounded-2xl bg-[#FFFFFF] border border-dashed border-[#DCE3DD] flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-[#006241]" />
            </div>
            <div className="max-w-xs">
              <p className="text-sm font-semibold text-[#1E2923]">
                ยังไม่มีข้อมูลการวิเคราะห์
              </p>
              <p className="text-xs text-[#5A655E] mt-1 leading-relaxed">
                เลือกสิ่งที่ต้องการตรวจสอบและป้อนข้อมูล จากนั้นกดตรวจ
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {/* Requirement 4 & 5: File Mode with Document Comparison Preview & Export */}
            {isFileMode ? (
              activeFileTab === 'preview' && documentPreviewData ? (
                <DocumentComparePreview
                  previewData={documentPreviewData}
                  analysisResult={result}
                  structureResult={structureResult}
                  onDownloadFeedback={onDownloadFeedback}
                  isFullScreen={false}
                  onToggleFullScreen={onOpenFullScreen}
                />
              ) : structureResult ? (
                <StructurePanel structureResult={structureResult} />
              ) : null
            ) : (
              /* Requirement 3: Standard Word & Grammar check for Typed Text */
              <div className="space-y-5">
                <SummaryStats result={result} />
                <QualityScore score={result.score} />
                <IssueCategories
                  categories={result.categories}
                  activeCategory={activeCategoryFilter}
                  onFilterCategory={(cat) => setActiveCategoryFilter(cat)}
                />
                <IssueRecommendation
                  originalText={result.originalText}
                  detectedText={result.detectedText}
                  replacement={result.replacement}
                  reason={result.reason}
                  highlights={result.highlights}
                  activeFilter={activeCategoryFilter}
                />
                <ImprovedText
                  originalText={result.originalText}
                  improvedText={result.improvedText}
                  onApplyImprovement={onApplyImprovement}
                  onCopySuccess={onCopySuccess}
                />
                <IssueAccordion
                  breakdown={result.detailedBreakdown}
                  activeFilter={activeCategoryFilter}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
