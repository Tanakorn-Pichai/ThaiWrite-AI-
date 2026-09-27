import React, { useState } from 'react';
import { StructureResult } from '../../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  FileSpreadsheet,
  ListOrdered,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';

interface StructurePanelProps {
  structureResult: StructureResult;
}

const displayTemplateName = (name: string) => name.replace(/^แม่แบบ\s*/, '');

export const StructurePanel: React.FC<StructurePanelProps> = ({
  structureResult,
}) => {
  const [activeTab, setActiveTab] = useState<'sections' | 'formatting' | 'actions'>(
    'sections'
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const {
    templateName,
    overallScore,
    complianceStatus,
    sectionsSummary,
    sectionChecks,
    formattingChecks,
    structureRecommendations,
  } = structureResult;

  const filteredSections = sectionChecks.filter((sec) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'missing') return sec.status === 'missing';
    if (filterStatus === 'out_of_order') return sec.status === 'out_of_order';
    if (filterStatus === 'present') return sec.status === 'present';
    return true;
  });

  const getStatusBadge = (status: 'pass' | 'needs_revision' | 'fail') => {
    if (status === 'pass') {
      return {
        label: 'ผ่านเกณฑ์รูปแบบเอกสาร',
        bg: 'bg-[#E2ECE5] text-[#006241] border-[#006241]/30',
        icon: CheckCircle2,
      };
    }
    if (status === 'needs_revision') {
      return {
        label: 'ควรปรับปรุงบางหัวข้อ',
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'ไม่ผ่านเกณฑ์ ขาดหัวข้อหลัก',
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      icon: XCircle,
    };
  };

  const statusBadge = getStatusBadge(complianceStatus);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-4">
      {/* Top Banner: Template Name & Compliance Score */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#006241]/20 bg-[#F4F6F4] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#DCE3DD]">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-[#006241] shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-[#5A655E] uppercase tracking-wider block">
                เทียบกับรูปแบบเอกสาร
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#1E2923]">
                {displayTemplateName(templateName)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* Structure Score & Progress */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[#5A655E] font-medium">
              คะแนนโครงสร้างเอกสาร
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-[#006241] tabular-nums">
                {overallScore}
              </span>
              <span className="text-xs text-[#5A655E] font-mono">/ 100</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
            <div className="text-center px-2.5 py-1 rounded-lg bg-[#E2ECE5] border border-[#006241]/20">
              <span className="text-[#006241] font-bold block">
                {sectionsSummary.matched}
              </span>
              <span className="text-[10px] text-[#006241]">ครบ</span>
            </div>
            <div className="text-center px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200">
              <span className="text-rose-700 font-bold block">
                {sectionsSummary.missing}
              </span>
              <span className="text-[10px] text-rose-800">ขาด</span>
            </div>
            <div className="text-center px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-amber-700 font-bold block">
                {sectionsSummary.outOfOrder}
              </span>
              <span className="text-[10px] text-amber-800">สลับลำดับ</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E2ECE5] h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-[#006241] h-full rounded-full transition-all duration-700"
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Internal Navigation Tabs for Structure */}
      <div className="flex items-center gap-1 p-1 bg-[#E2ECE5]/70 rounded-xl border border-[#DCE3DD] text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-white text-[#1E2923] shadow-xs font-bold'
              : 'text-[#5A655E] hover:text-[#1E2923]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#006241]" />
          <span>หัวข้อ ({sectionsSummary.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('formatting')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'formatting'
              ? 'bg-white text-[#1E2923] shadow-xs font-bold'
              : 'text-[#5A655E] hover:text-[#1E2923]'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#006241]" />
          <span>การจัดหน้า ({formattingChecks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'actions'
              ? 'bg-white text-[#1E2923] shadow-xs font-bold'
              : 'text-[#5A655E] hover:text-[#1E2923]'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5 text-[#006241]" />
          <span>ข้อเสนอแนะ ({structureRecommendations.length})</span>
        </button>
      </div>

      {/* TAB 1: Sections Checklist */}
      {activeTab === 'sections' && (
        <div className="space-y-2.5">
          {/* Quick Filter buttons */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-semibold text-[#1E2923]">
              รายการหัวข้อตามรูปแบบเอกสาร:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-[#006241] text-white'
                    : 'bg-white text-[#5A655E] border border-[#DCE3DD]'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('missing')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterStatus === 'missing'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-rose-700 border border-rose-200'
                }`}
              >
                ขาด ({sectionsSummary.missing})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('out_of_order')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterStatus === 'out_of_order'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-amber-700 border border-amber-200'
                }`}
              >
                สลับ ({sectionsSummary.outOfOrder})
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#DCE3DD] border border-[#DCE3DD] rounded-xl overflow-hidden bg-white max-h-[380px] overflow-y-auto">
            {filteredSections.map((sec) => {
              const isPresent = sec.status === 'present';
              const isMissing = sec.status === 'missing';
              const isOutOfOrder = sec.status === 'out_of_order';

              return (
                <div
                  key={sec.id}
                  className={`p-3 text-xs flex items-start justify-between gap-3 transition-colors ${
                    isMissing
                      ? 'bg-rose-50/50'
                      : isOutOfOrder
                      ? 'bg-amber-50/50'
                      : 'hover:bg-[#F4F6F4]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isPresent && (
                        <CheckCircle2 className="w-4 h-4 text-[#006241]" />
                      )}
                      {isMissing && (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      {isOutOfOrder && (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      {sec.status === 'warning' && (
                        <AlertTriangle className="w-4 h-4 text-[#5A655E]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            sec.level === 1
                              ? 'text-[#1E2923] text-xs sm:text-sm'
                              : 'text-[#5A655E] pl-1'
                          }`}
                        >
                          {sec.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#5A655E]">
                          ลำดับ #{sec.expectedPosition}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5A655E] mt-0.5 leading-snug">
                        {sec.note}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isPresent
                          ? 'bg-[#E2ECE5] text-[#006241] border-[#006241]/20'
                          : isMissing
                          ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                          : isOutOfOrder
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isPresent
                        ? 'พบครบ'
                        : isMissing
                        ? 'ไม่พบ'
                        : isOutOfOrder
                        ? 'สลับลำดับ'
                        : 'ตัวเลือก'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Formatting Checks */}
      {activeTab === 'formatting' && (
        <div className="space-y-2.5">
          <p className="text-xs text-[#5A655E]">
            ตรวจสอบแบบอักษร ขนาดตัวอักษร ระยะขอบ และเลขหน้า
          </p>

          <div className="space-y-2">
            {formattingChecks.map((rule) => {
              const isPass = rule.status === 'pass';
              const isWarn = rule.status === 'warning';

              return (
                <div
                  key={rule.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isPass
                      ? 'bg-white border-[#DCE3DD]'
                      : isWarn
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPass ? (
                        <CheckCircle2 className="w-4 h-4 text-[#006241]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="font-bold text-[#1E2923]">
                        {rule.ruleName}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isPass
                          ? 'bg-[#E2ECE5] text-[#006241] border-[#006241]/20'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {isPass ? 'ถูกต้อง' : rule.status === 'unknown' ? 'ตรวจไม่ได้' : 'ควรปรับแก้'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded bg-[#F4F6F4] border border-[#DCE3DD]">
                      <span className="text-[#5A655E] block">เกณฑ์รูปแบบเอกสาร:</span>
                      <span className="font-medium text-[#1E2923]">{rule.expected}</span>
                    </div>
                    <div className="p-2 rounded bg-[#F4F6F4] border border-[#DCE3DD]">
                      <span className="text-[#5A655E] block">ที่ตรวจพบ:</span>
                      <span className="font-medium text-[#1E2923]">{rule.detected}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#5A655E] pt-1">
                    <strong className="text-[#006241]">คำแนะนำ:</strong> {rule.recommendation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Actionable Recommendations */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-[#E2ECE5] border border-[#006241]/20 text-xs text-[#1E2923] flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#006241] shrink-0 mt-0.5" />
            <p>
              ขั้นตอนการปรับปรุงเอกสารให้สอดคล้องกับ <strong>{templateName}</strong>
            </p>
          </div>

          <div className="space-y-2">
            {structureRecommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-[#DCE3DD] bg-white flex items-start gap-2.5 text-xs text-[#1E2923]"
              >
                <div className="w-5 h-5 rounded-full bg-[#E2ECE5] text-[#006241] font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                  {i + 1}
                </div>
                <p className="leading-relaxed flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
