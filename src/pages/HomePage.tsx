import React, { useState, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { Hero } from '../components/layout/Hero';
import { Footer } from '../components/layout/Footer';
import { InputPanel } from '../components/input/InputPanel';
import { ResultPanel } from '../components/results/ResultPanel';
import { DocumentComparePreview } from '../components/results/DocumentComparePreview';
import { HistoryModal } from '../components/modals/HistoryModal';
import { GuideModal } from '../components/modals/GuideModal';
import { ProfileModal } from '../components/modals/ProfileModal';
import { Toast } from '../components/feedback/Toast';
import {
  InputMode,
  WritingStyle,
  AnalysisResult,
  StructureResult,
  DocTemplate,
  UploadedFile,
  HistoryItem,
  ToastMessage,
  CheckOptions,
  DocumentPreviewData,
} from '../types';
import {
  SAMPLE_TEXT,
  DEFAULT_MOCK_ANALYSIS,
  generateAnalysis,
} from '../data/mockAnalysis';
import { STANDARD_TEMPLATES, evaluateStructure } from '../data/mockTemplates';
import { INITIAL_MOCK_HISTORY } from '../data/mockHistory';
import { generateDocumentPreview } from '../data/mockDocumentPreview';

export const HomePage: React.FC = () => {
  // Page view mode: standard split layout or dedicated full-width document review
  const [pageView, setPageView] = useState<'split' | 'document_fullscreen'>('split');

  // 1. Check Scope Options (Requirement 1: Multi-select checking criteria)
  const [checkOptions, setCheckOptions] = useState<CheckOptions>({
    checkWords: true,
    checkStructure: true,
    compareTemplate: true,
  });

  // 2. Main Input & Template states (Requirement 2: Mode & Conditional template)
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate>(
    STANDARD_TEMPLATES[0]
  );
  const [customTemplateFile, setCustomTemplateFile] = useState<UploadedFile | null>(
    null
  );
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('เชิงวิชาการ');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3. Results states (Requirement 3: Standard text result, Requirement 4 & 5: Document preview & export)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    DEFAULT_MOCK_ANALYSIS
  );
  const [structureResult, setStructureResult] = useState<StructureResult | null>(
    () => evaluateStructure(SAMPLE_TEXT, undefined, STANDARD_TEMPLATES[0])
  );
  const [documentPreviewData, setDocumentPreviewData] = useState<DocumentPreviewData | null>(
    () => generateDocumentPreview('รายงานโครงงาน_ปัญญาประดิษฐ์.docx', STANDARD_TEMPLATES[0].name, SAMPLE_TEXT)
  );

  // Modals state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_MOCK_HISTORY);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Textarea ref for refocusing
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const showToast = (
    text: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Text actions
  const handleClearText = () => {
    setText('');
    showToast('ล้างข้อความเรียบร้อยแล้ว', 'info');
  };

  const handleUseSampleText = () => {
    setInputMode('text');
    setText(SAMPLE_TEXT);
    showToast('ใส่ข้อความตัวอย่างเรียบร้อยแล้ว', 'success');
  };

  // File actions
  const handleFileSelect = (file: UploadedFile) => {
    setUploadedFile(file);
    if (file.content && file.content.trim().length > 0) {
      setText(file.content);
      showToast(`อัปโหลดและดึงเนื้อหาจาก "${file.name}" เรียบร้อยแล้ว`, 'success');
    } else {
      showToast(`อัปโหลดไฟล์ "${file.name}" เรียบร้อยแล้ว`, 'success');
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    showToast('ลบไฟล์เอกสารแล้ว', 'info');
  };

  const handleFileError = (msg: string) => {
    showToast(msg, 'error');
  };

  // Custom Template Handlers
  const handleCustomTemplateUpload = (file: UploadedFile) => {
    setCustomTemplateFile(file);
    showToast(`ใช้ไฟล์แม่แบบเฉพาะ: ${file.name}`, 'success');
  };

  const handleRemoveCustomTemplate = () => {
    setCustomTemplateFile(null);
    setSelectedTemplate(STANDARD_TEMPLATES[0]);
    showToast('เปลี่ยนกลับมาใช้แม่แบบมาตรฐาน', 'info');
  };

  // Trigger Analysis
  const handleAnalyze = () => {
    if (inputMode === 'text') {
      if (!text.trim()) {
        showToast('กรุณากรอกข้อความก่อนทำการตรวจสอบ', 'warning');
        return;
      }
    } else {
      if (!uploadedFile) {
        showToast('กรุณาเลือกไฟล์เอกสารที่จะให้ตรวจ', 'warning');
        return;
      }
    }

    setIsLoading(true);

    setTimeout(() => {
      let langResult: AnalysisResult;
      let structResult: StructureResult | null = null;
      let docName = 'ข้อความทั่วไป.txt';

      if (inputMode === 'file' && uploadedFile) {
        docName = uploadedFile.name;
        // Prioritize actual content extracted from the file, or fallback to textarea content
        const realContent = uploadedFile.content && uploadedFile.content.trim().length > 0
          ? uploadedFile.content.trim()
          : text.trim().length > 0
          ? text.trim()
          : 'บทที่ 1 บทนำ 1.1 ความเป็นมา การประมวลผลภาษาธรรมชาติ';

        langResult = generateAnalysis(
          realContent,
          writingStyle,
          uploadedFile.name
        );

        if (checkOptions.compareTemplate || checkOptions.checkStructure) {
          structResult = evaluateStructure(
            realContent,
            uploadedFile.name,
            selectedTemplate
          );
        }

        // Generate document preview using THE REAL CONTENT
        const preview = generateDocumentPreview(
          uploadedFile.name,
          selectedTemplate.name,
          realContent
        );
        setDocumentPreviewData(preview);

        // Transition to dedicated full screen document review
        setPageView('document_fullscreen');
      } else {
        docName = `ข้อความ_${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}.txt`;
        langResult = generateAnalysis(text, writingStyle);
        if (checkOptions.checkStructure) {
          structResult = evaluateStructure(text, undefined, selectedTemplate);
        }

        // Also generate document preview using the real typed text
        const preview = generateDocumentPreview(
          docName,
          selectedTemplate.name,
          text
        );
        setDocumentPreviewData(preview);
      }

      setAnalysisResult(langResult);
      setStructureResult(structResult);
      setIsLoading(false);

      if (inputMode === 'file') {
        showToast(`ตรวจเอกสาร "${docName}" และเปิดหน้าพรีวิวเต็มจอเรียบร้อยแล้ว`, 'success');
      } else {
        showToast(`ตรวจวิเคราะห์ข้อความ (${langResult.score}/100) สำเร็จ`, 'success');
      }

      // Append to history
      const now = new Date();
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
      ];
      const formattedDate = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543} - ${now.toLocaleTimeString(
        'th-TH',
        { hour: '2-digit', minute: '2-digit' }
      )} น.`;

      const newHistoryItem: HistoryItem = {
        id: `hist-${Date.now()}`,
        documentName: docName,
        score: langResult.score,
        structureScore: structResult?.overallScore,
        templateName: checkOptions.compareTemplate ? selectedTemplate.name : undefined,
        date: formattedDate,
        wordCount: langResult.wordCount,
        writingStyle: writingStyle,
        originalSnippet: langResult.originalText,
        improvedSnippet: langResult.improvedText,
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
    }, 750);
  };

  // Apply Improved Text back to editor
  const handleApplyImprovement = () => {
    if (!analysisResult) return;
    setInputMode('text');
    setText(analysisResult.improvedText);
    showToast('นำข้อความที่ปรับปรุงไปใช้แล้ว', 'success');

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          analysisResult.improvedText.length,
          analysisResult.improvedText.length
        );
      }
    }, 50);
  };

  const handleCopySuccess = () => {
    showToast('คัดลอกข้อความแล้ว', 'success');
  };

  // Select item from history modal
  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.originalSnippet) {
      setInputMode('text');
      setText(item.originalSnippet);
      const res = generateAnalysis(
        item.originalSnippet,
        item.writingStyle || 'เชิงวิชาการ'
      );
      setAnalysisResult(res);

      if (item.templateName) {
        const matchedTemplate =
          STANDARD_TEMPLATES.find((t) => t.name === item.templateName) ||
          selectedTemplate;
        setSelectedTemplate(matchedTemplate);
        setStructureResult(
          evaluateStructure(item.originalSnippet, undefined, matchedTemplate)
        );
      }

      showToast(`โหลดเอกสาร "${item.documentName}" แล้ว`, 'info');
    }
    setHistoryOpen(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    showToast('ล้างประวัติการตรวจสอบแล้ว', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F4] text-[#1E2923]">
      {/* 
        CASE 1: FULL SCREEN DOCUMENT REVIEW MODE ("เฉพาะในหน้านี้เท่านั้น")
        The document is 100% full screen with transparent hover overlays!
      */}
      {pageView === 'document_fullscreen' && documentPreviewData ? (
        <DocumentComparePreview
          previewData={documentPreviewData}
          analysisResult={analysisResult}
          structureResult={structureResult}
          onDownloadFeedback={(msg) => showToast(msg, 'success')}
          isFullScreen={true}
          onToggleFullScreen={() => setPageView('split')}
          onBackToHome={() => setPageView('split')}
        />
      ) : (
        /* CASE 2: NORMAL HOME VIEW (Standard Header, Hero, Input/Result Grid, Footer) */
        <>
          {/* Header */}
          <Header
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenGuide={() => setGuideOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
          />

          {/* Hero Section */}
          <Hero />

          {/* Main Workspace Container */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
              {/* Left Column: Input Panel */}
              <section aria-label="กล่องป้อนข้อความและเอกสาร">
                <InputPanel
                  checkOptions={checkOptions}
                  onCheckOptionsChange={setCheckOptions}
                  mode={inputMode}
                  onSelectMode={setInputMode}
                  text={text}
                  onTextChange={setText}
                  onClearText={handleClearText}
                  onUseSampleText={handleUseSampleText}
                  file={uploadedFile}
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  onFileError={handleFileError}
                  style={writingStyle}
                  onStyleChange={setWritingStyle}
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                  customTemplateFile={customTemplateFile}
                  onCustomTemplateUpload={handleCustomTemplateUpload}
                  onRemoveCustomTemplate={handleRemoveCustomTemplate}
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  textareaRef={textareaRef}
                />
              </section>

              {/* Right Column: Result Panel */}
              <section aria-label="ผลการตรวจสอบและข้อเสนอแนะ">
                <ResultPanel
                  mode={inputMode}
                  checkOptions={checkOptions}
                  result={analysisResult}
                  structureResult={structureResult}
                  documentPreviewData={documentPreviewData}
                  isLoading={isLoading}
                  onApplyImprovement={handleApplyImprovement}
                  onCopySuccess={handleCopySuccess}
                  onDownloadFeedback={(msg) => showToast(msg, 'success')}
                  onOpenFullScreen={() => setPageView('document_fullscreen')}
                />
              </section>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </>
      )}

      {/* Modals */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      <GuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        totalChecks={history.length}
      />

      {/* Toast Feedback */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
