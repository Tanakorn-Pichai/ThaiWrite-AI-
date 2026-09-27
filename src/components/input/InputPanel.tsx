import React from 'react';
import {
  InputMode,
  WritingStyle,
  UploadedFile,
  DocTemplate,
  CheckOptions,
} from '../../types';
import { ScopeSelector } from './ScopeSelector';
import { InputTabs } from './InputTabs';
import { TextInput } from './TextInput';
import { FileDropzone } from './FileDropzone';
import { FilePreview } from './FilePreview';
import { WritingStyleSelector } from './WritingStyleSelector';
import { TemplateSelector } from './TemplateSelector';
import { Search, Loader2 } from 'lucide-react';

interface InputPanelProps {
  checkOptions: CheckOptions;
  onCheckOptionsChange: (options: CheckOptions) => void;
  mode: InputMode;
  onSelectMode: (mode: InputMode) => void;
  text: string;
  onTextChange: (text: string) => void;
  onClearText: () => void;
  onUseSampleText: () => void;
  file: UploadedFile | null;
  onFileSelect: (file: UploadedFile) => void;
  onFileRemove: () => void;
  onFileError: (msg: string) => void;
  style: WritingStyle;
  onStyleChange: (style: WritingStyle) => void;
  selectedTemplate: DocTemplate;
  templates: DocTemplate[];
  templatesLoading: boolean;
  onSelectTemplate: (tmpl: DocTemplate) => void;
  customTemplateFile: UploadedFile | null;
  onCustomTemplateUpload: (file: UploadedFile) => void;
  onRemoveCustomTemplate: () => void;
  onAnalyze: () => void;
  isLoading: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  checkOptions,
  onCheckOptionsChange,
  mode,
  onSelectMode,
  text,
  onTextChange,
  onClearText,
  onUseSampleText,
  file,
  onFileSelect,
  onFileRemove,
  onFileError,
  style,
  onStyleChange,
  selectedTemplate,
  templates,
  templatesLoading,
  onSelectTemplate,
  customTemplateFile,
  onCustomTemplateUpload,
  onRemoveCustomTemplate,
  onAnalyze,
  isLoading,
  textareaRef,
}) => {
  // Compute if options require document file mode
  const requiresFileMode = checkOptions.compareTemplate || checkOptions.checkStructure;

  // Auto-switch to file mode if structure or template check is enabled
  React.useEffect(() => {
    if (requiresFileMode && mode !== 'file') {
      onSelectMode('file');
    }
  }, [requiresFileMode, mode, onSelectMode]);

  // Compute descriptive action button label
  const getActionLabel = () => {
    const parts = [];
    if (checkOptions.checkWords) parts.push('คำ');
    if (checkOptions.checkStructure) parts.push('โครงสร้าง');
    if (mode === 'file' && checkOptions.compareTemplate) parts.push('เทียบรูปแบบเอกสาร');
    return parts.length > 0 ? `ตรวจ${parts.join(' และ ')}` : 'ตรวจเอกสาร';
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DCE3DD] shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full space-y-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-2.5 border-b border-[#DCE3DD]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1E2923]">
              นำเข้าเอกสาร
            </h2>
          </div>
          <p className="text-xs text-[#5A655E] mt-0.5">
            ตรวจคำ ไวยากรณ์ และโครงสร้างตามรูปแบบเอกสาร
          </p>
        </div>

        {/* 1. Scope Selector (Requirement 1: Choose what to check first) */}
        <ScopeSelector
          options={checkOptions}
          onChange={(newOpts) => {
            onCheckOptionsChange(newOpts);
            if ((newOpts.compareTemplate || newOpts.checkStructure) && mode !== 'file') {
              onSelectMode('file');
            }
          }}
          inputMode={mode}
        />

        {/* 2. Choose Text or Document File (Locked to file mode if compareTemplate or checkStructure is checked) */}
        <div className="space-y-2 pt-1">
          <label className="text-xs sm:text-sm font-bold text-[#1E2923] block">
            2. เลือกรูปแบบ (ข้อความ หรือ ไฟล์เอกสาร)
          </label>
          <InputTabs
            mode={mode}
            onSelectMode={onSelectMode}
            disabledTextMode={requiresFileMode}
            disabledReason="การตรวจโครงสร้างหรือเทียบรูปแบบเอกสารรองรับเฉพาะไฟล์เอกสาร"
          />
        </div>

        {/* 3. Conditional Template Selector (Requirement 2: ONLY for file mode AND when compareTemplate is checked) */}
        {mode === 'file' && checkOptions.compareTemplate && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              templates={templates}
              templatesLoading={templatesLoading}
              onSelectTemplate={onSelectTemplate}
              customTemplateFile={customTemplateFile}
              onCustomTemplateUpload={onCustomTemplateUpload}
              onRemoveCustomTemplate={onRemoveCustomTemplate}
            />
          </div>
        )}

        {/* 4. Text / File Input Box */}
        <div className="space-y-2 pt-1">
          <label className="text-xs sm:text-sm font-bold text-[#1E2923] block">
            {mode === 'text' ? '3. ข้อความที่ต้องการตรวจ' : '3. แนบไฟล์เอกสาร'}
          </label>

          {mode === 'text' ? (
            <TextInput
              ref={textareaRef}
              value={text}
              onChange={onTextChange}
              onClear={onClearText}
              onUseSample={onUseSampleText}
              maxLength={20000}
            />
          ) : (
            <div className="space-y-3">
              {file ? (
                <FilePreview file={file} onRemove={onFileRemove} />
              ) : (
                <FileDropzone
                  onFileSelect={onFileSelect}
                  onError={onFileError}
                />
              )}
            </div>
          )}
        </div>

        {/* 5. Style Selector */}
        <div className="pt-1">
          <WritingStyleSelector
            selectedStyle={style}
            onSelectStyle={onStyleChange}
          />
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 border-t border-[#DCE3DD]">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-[#006241] hover:bg-[#004d33] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังตรวจวิเคราะห์...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>{getActionLabel()}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
