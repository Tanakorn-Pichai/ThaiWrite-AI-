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
import { submitAnalysis } from '../services/api';

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

  // Helper to record history
  const recordHistory = (docName: string, langRes: AnalysisResult, structRes: StructureResult | null) => {
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
      score: langRes.score,
      structureScore: structRes?.overallScore,
      templateName: checkOptions.compareTemplate ? selectedTemplate.name : undefined,
      date: formattedDate,
      wordCount: langRes.wordCount,
      writingStyle: writingStyle,
      originalSnippet: langRes.originalText,
      improvedSnippet: langRes.improvedText,
    };

    setHistory((prev) => [newHistoryItem, ...prev]);
  };

  // Trigger Analysis
  const handleAnalyze = async () => {
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

    try {
      // 1. Attempt Real Backend API Call (FastAPI + PyThaiNLP)
      const apiResponse = await submitAnalysis({
        templateId: selectedTemplate.id,
        writingStyle: writingStyle,
        inputMode: inputMode,
        text: inputMode === 'text' ? text : undefined,
        file: inputMode === 'file' && uploadedFile?.rawFile ? uploadedFile.rawFile : undefined,
      });

      if (apiResponse.status === 'completed' && apiResponse.result) {
        const { languageResult, structureResult } = apiResponse.result;
        setAnalysisResult(languageResult);
        setStructureResult(structureResult);

        const docName = apiResponse.result.documentName || (inputMode === 'file' && uploadedFile ? uploadedFile.name : 'ข้อความทั่วไป.txt');
        const contentForPreview = inputMode === 'file' && uploadedFile?.content ? uploadedFile.content : text;
        setDocumentPreviewData(generateDocumentPreview(docName, selectedTemplate.name, contentForPreview));

        recordHistory(docName, languageResult, structureResult);

        if (inputMode === 'file') {
          setPageView('document_fullscreen');
          showToast(`[FastAPI + PyThaiNLP] ตรวจเอกสาร "${docName}" เรียบร้อยแล้ว`, 'success');
        } else {
          showToast(`[FastAPI + PyThaiNLP] ตรวจวิเคราะห์ข้อความ (${languageResult.score}/100) สำเร็จ`, 'success');
        }
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend API connection fallback to client engine:', err);
    }

    // 2. Client-side fallback if backend API is offline
    setTimeout(() => {
      let langResult: AnalysisResult;
      let structResult: StructureResult | null = null;
      let docName = 'ข้อความทั่วไป.txt';

      if (inputMode === 'file' && uploadedFile) {
        docName = uploadedFile.name;
        const realContent = uploadedFile.content && uploadedFile.content.trim().length > 0
          ? uploadedFile.content.trim()
          : text.trim().length > 0
          ? text.trim()
          : 'บทที่ 1 บทนำ 1.1 ความเป็นมา การประมวลผลภาษาธรรมชาติ';

        langResult = generateAnalysis(realContent, writingStyle, uploadedFile.name);
        if (checkOptions.compareTemplate || checkOptions.checkStructure) {
          structResult = evaluateStructure(realContent, uploadedFile.name, selectedTemplate);
        }
        setDocumentPreviewData(generateDocumentPreview(uploadedFile.name, selectedTemplate.name, realContent));
        setPageView('document_fullscreen');
      } else {
        docName = `ข้อความ_${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}.txt`;
        langResult = generateAnalysis(text, writingStyle);
        if (checkOptions.checkStructure) {
          structResult = evaluateStructure(text, undefined, selectedTemplate);
        }
        setDocumentPreviewData(generateDocumentPreview(docName, selectedTemplate.name, text));
      }

      setAnalysisResult(langResult);
      setStructureResult(structResult);
      recordHistory(docName, langResult, structResult);
      setIsLoading(false);

      if (inputMode === 'file') {
        showToast(`ตรวจเอกสาร "${docName}" และเปิดหน้าพรีวิวเรียบร้อยแล้ว`, 'success');
      } else {
        showToast(`ตรวจวิเคราะห์ข้อความ (${langResult.score}/100) สำเร็จ`, 'success');
      }
    }, 400);
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
    }, 100);
  };

  // Restore item from History Modal
  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.originalSnippet) {
      setInputMode('text');
      setText(item.originalSnippet);

      const restoredAnalysis = generateAnalysis(
        item.originalSnippet,
        item.writingStyle || 'เชิงวิชาการ'
      );
      setAnalysisResult(restoredAnalysis);

      if (checkOptions.checkStructure) {
        setStructureResult(
          evaluateStructure(item.originalSnippet, undefined, selectedTemplate)
        );
      }

      showToast(`โหลดประวัติ "${item.documentName}" สำเร็จ`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col font-['Prompt',sans-serif]">
      {/* Toast container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Conditional Layout for Document Fullscreen Review */}
      {pageView === 'document_fullscreen' && documentPreviewData ? (
        <DocumentComparePreview
          previewData={documentPreviewData}
          analysisResult={analysisResult}
          structureResult={structureResult}
          onBackToHome={() => setPageView('split')}
          isFullScreen={true}
        />
      ) : (
        <>
          {/* Main App Bar Header */}
          <Header
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenGuide={() => setGuideOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
          />

          {/* Hero Section */}
          <Hero
            onStartWriting={() => {
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
          />

          {/* Main Content Workspace */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Input & Settings (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
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
              </div>

              {/* Right Column: Analysis Results (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <ResultPanel
                  mode={inputMode}
                  checkOptions={checkOptions}
                  result={analysisResult}
                  structureResult={structureResult}
                  documentPreviewData={documentPreviewData}
                  isLoading={isLoading}
                  onApplyImprovement={handleApplyImprovement}
                  onCopySuccess={() => showToast('คัดลอกข้อความแล้ว', 'success')}
                  onDownloadFeedback={(msg) => showToast(msg, 'info')}
                  onOpenFullScreen={() => {
                    if (documentPreviewData) {
                      setPageView('document_fullscreen');
                    } else {
                      showToast('กรุณากดตรวจเอกสารก่อนดูพรีวิว', 'warning');
                    }
                  }}
                />
              </div>
            </div>
          </main>

          {/* Site Footer */}
          <Footer />
        </>
      )}

      {/* Modals */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
      />
      <GuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};
