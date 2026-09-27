import React, { useRef, useState } from 'react';
import { DocTemplate, UploadedFile } from '../../types';
import { uploadCustomTemplate } from '../../services/api';

const displayTemplateName = (name: string) => name.replace(/^แม่แบบ\s*/, '');
import {
  FileCode,
  Upload,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate: DocTemplate;
  templates: DocTemplate[];
  templatesLoading: boolean;
  onSelectTemplate: (template: DocTemplate) => void;
  onCustomTemplateUpload: (file: UploadedFile) => void;
  customTemplateFile: UploadedFile | null;
  onRemoveCustomTemplate: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  templates,
  templatesLoading,
  onSelectTemplate,
  onCustomTemplateUpload,
  customTemplateFile,
  onRemoveCustomTemplate,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTemplateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validExtensions = ['.docx', '.pdf'];
      const lowerName = file.name.toLowerCase();
      const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

      if (!hasValidExt) {
        alert('กรุณาอัปโหลดไฟล์รูปแบบเอกสารนามสกุล .docx หรือ .pdf');
        return;
      }

      const formattedSize =
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

      const customFile: UploadedFile = {
        name: file.name,
        size: file.size,
        formattedSize,
        type: file.type || 'template',
        rawFile: file,
      };

      setIsUploading(true);
      try {
        const uploaded = await uploadCustomTemplate(file);
        onCustomTemplateUpload(customFile);
        onSelectTemplate({
          id: uploaded.id,
          name: uploaded.name,
          shortName: uploaded.name.slice(0, 18),
          code: uploaded.code,
          category: uploaded.category,
          description: uploaded.description || 'รูปแบบเอกสารที่อัปโหลดเอง',
          university: uploaded.university,
          isCustom: true,
          requiredSections: uploaded.requiredSections,
          formattingRules: uploaded.formattingRules,
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : 'อัปโหลดรูปแบบเอกสารไม่สำเร็จ');
        return;
      } finally {
        setIsUploading(false);
      }

      /* Legacy client template construction retained only for fixture reference.
      const customTmpl: DocTemplate = {
        id: `tmpl-custom-${Date.now()}`,
        name: `รูปแบบเอกสารเฉพาะ: ${file.name.replace(/\.[^/.]+$/, '')}`,
        shortName: file.name.replace(/\.[^/.]+$/, '').slice(0, 18),
        code: 'CUSTOM-TEMPLATE',
        category: 'custom',
        description: 'รูปแบบเอกสารที่อัปโหลดเอง',
        university: 'กำหนดเอง',
        isCustom: true,
        formattingRules: {
          fontFamily: 'TH Sarabun New / PSK',
          fontSizeHeading: '18pt / 16pt หนา',
          fontSizeBody: '16pt ปกติ',
          margins: 'บน-ล่าง 1.0", ซ้าย 1.5", ขวา 1.0"',
          lineSpacing: '1.0 เท่า',
          pageNumbering: 'มุมบนขวา',
        },
        requiredSections: [
          { id: 'cs1', title: 'บทนำ / ส่วนนำของเอกสาร', level: 1, required: true },
          { id: 'cs2', title: 'วัตถุประสงค์และขอบเขต', level: 1, required: true },
          { id: 'cs3', title: 'เนื้อหาหลักและระเบียบวิธี', level: 1, required: true },
          { id: 'cs4', title: 'ผลการศึกษาและวิเคราะห์', level: 1, required: true },
          { id: 'cs5', title: 'สรุปและข้อเสนอแนะ', level: 1, required: true },
          { id: 'cs6', title: 'เอกสารอ้างอิง / บรรณานุกรม', level: 1, required: true },
        ],
      };

      onSelectTemplate(customTmpl);
      */
      e.target.value = '';
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-[#006241]/20 bg-[#FFFFFF] space-y-3">
      {/* Title bar without unnecessary explanations */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#006241] text-white flex items-center justify-center shadow-2xs">
            <FileCode className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-[#1E2923]">
            1. เลือกรูปแบบเอกสาร
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-[#006241] hover:text-[#004d33] font-medium flex items-center gap-1 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{showDetails ? 'ซ่อนเกณฑ์' : 'ดูเกณฑ์'}</span>
        </button>
      </div>

      {/* Clean Template Select Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {templatesLoading ? (
          <p className="col-span-full text-xs text-[#5A655E]">กำลังโหลดรูปแบบเอกสารจาก Backend...</p>
        ) : templates.filter((tmpl) => !tmpl.isCustom && tmpl.category !== 'custom').map((tmpl) => {
          const isSelected = selectedTemplate.id === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl)}
              className={`py-2.5 px-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                isSelected
                  ? 'bg-[#E2ECE5]/40 border-[#006241] ring-2 ring-[#006241]/20 shadow-xs'
                  : 'bg-white border-[#DCE3DD] hover:border-[#006241]/40 hover:bg-[#F4F6F4]/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-[#006241] bg-[#006241] text-white'
                      : 'border-[#DCE3DD] bg-white'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#1E2923] truncate">
                  {displayTemplateName(tmpl.shortName || tmpl.name)}
                </span>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#E2ECE5] text-[#006241] rounded-md font-semibold shrink-0">
                {tmpl.requiredSections.length} หัวข้อ
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Template Upload Row */}
      <div className="pt-2 border-t border-[#DCE3DD]">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf"
          className="hidden"
          onChange={handleTemplateFileUpload}
        />

        {customTemplateFile ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E2ECE5] border border-[#006241]/30 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-[#006241] shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-[#1E2923]">รูปแบบเอกสารของคุณ:</span>{' '}
                <span className="font-medium text-[#006241]">
                  {customTemplateFile.name}
                </span>
                <span className="text-[10px] text-[#5A655E] ml-1.5 font-mono">
                  ({customTemplateFile.formattedSize})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemoveCustomTemplate}
              className="text-rose-600 hover:text-rose-800 text-[11px] font-medium ml-2 shrink-0 cursor-pointer"
            >
              เปลี่ยนกลับ
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5A655E]">หรือใช้รูปแบบเอกสารของคุณเอง:</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DCE3DD] hover:border-[#006241] text-[#006241] font-medium hover:bg-[#E2ECE5] transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#006241]" />
              <span>อัปโหลดรูปแบบเอกสาร</span>
            </button>
          </div>
        )}
      </div>

      {/* Expandable Template Details (Only when user explicitly clicks ดูเกณฑ์) */}
      {showDetails && (
        <div className="mt-3 p-3.5 rounded-xl bg-[#F4F6F4] border border-[#DCE3DD] space-y-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#DCE3DD] pb-2">
            <span className="font-bold text-[#1E2923] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#006241]" />
              เกณฑ์รูปแบบเอกสาร: {displayTemplateName(selectedTemplate.name)}
            </span>
            <span className="font-mono text-[10px] bg-[#E2ECE5] text-[#006241] px-2 py-0.5 rounded font-semibold">
              {selectedTemplate.code}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#5A655E]">
            <div>
              <p>
                <strong className="text-[#1E2923]">แบบอักษร:</strong>{' '}
                {selectedTemplate.formattingRules.fontFamily}
              </p>
              <p className="mt-1">
                <strong className="text-[#1E2923]">ขนาด:</strong>{' '}
                {selectedTemplate.formattingRules.fontSizeHeading} / เนื้อหา {selectedTemplate.formattingRules.fontSizeBody}
              </p>
            </div>
            <div>
              <p>
                <strong className="text-[#1E2923]">ระยะขอบ:</strong>{' '}
                {selectedTemplate.formattingRules.margins}
              </p>
              <p className="mt-1">
                <strong className="text-[#1E2923]">เลขหน้า:</strong>{' '}
                {selectedTemplate.formattingRules.pageNumbering}
              </p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-[#1E2923] mb-1.5">
              หัวข้อบังคับ ({selectedTemplate.requiredSections.length} รายการ):
            </p>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {selectedTemplate.requiredSections.map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between py-1 px-2 rounded bg-white border border-[#DCE3DD] text-[11px]"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-[#006241]" />
                    <span className={sec.level === 1 ? 'font-semibold text-[#1E2923]' : 'text-[#5A655E] pl-2'}>
                      {sec.title}
                    </span>
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                      sec.required
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sec.required ? 'บังคับ' : 'ตัวเลือก'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
