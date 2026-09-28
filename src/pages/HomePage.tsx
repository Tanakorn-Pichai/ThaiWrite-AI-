import React, { useState, useRef, useEffect } from 'react';
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
  DocumentAnnotation,
} from '../types';
import { fetchTemplates, submitAnalysis, pollAnalysisJob, fetchHistory, fetchProfileStats } from '../services/api';

function buildApiDocumentPreview(
  documentName: string,
  content: string,
  result: AnalysisResult,
  structure: StructureResult,
): DocumentPreviewData | null {
  const cleanContent = content.trim();
  if (!cleanContent) return null;

  const highlights = result.highlights || [];
  const annotations: DocumentAnnotation[] = highlights.map((issue, index) => ({
    id: `api-${index + 1}`,
    number: index + 1,
    type: 'word',
    originalText: issue.text,
    suggestedText: issue.replacement,
    comment: issue.reason,
    category: issue.type,
    severity: issue.type === 'spelling' ? 'error' : 'warning',
  }));

  const paragraphs = cleanContent.split(/\r?\n+/).filter(Boolean);
  const pageParagraphs: string[][] = [];
  const maxPageCharacters = 1800;
  let currentPage: string[] = [];
  let currentLength = 0;

  paragraphs.forEach((paragraph) => {
    if (currentPage.length > 0 && currentLength + paragraph.length > maxPageCharacters) {
      pageParagraphs.push(currentPage);
      currentPage = [];
      currentLength = 0;
    }
    currentPage.push(paragraph);
    currentLength += paragraph.length;
  });
  if (currentPage.length > 0) pageParagraphs.push(currentPage);

  let annotationOffset = 0;
  const pages = pageParagraphs.map((page, pageIndex) => {
    const pageText = page.join('\n');
    const pageAnnotations = annotations.filter((annotation) => {
      const foundAt = pageText.indexOf(annotation.originalText);
      if (foundAt === -1) return false;
      return true;
    });
    pageAnnotations.forEach((annotation) => {
      annotation.number = annotation.number || ++annotationOffset;
    });
    return {
      pageNumber: pageIndex + 1,
      originalText: pageText,
      annotatedParagraphs: page.map((paragraph, paragraphIndex) => ({
        id: `api-page-${pageIndex + 1}-paragraph-${paragraphIndex + 1}`,
        text: paragraph,
        annotations: pageAnnotations.filter((annotation) => paragraph.includes(annotation.originalText)),
      })),
    };
  });

  return {
    documentName,
    totalWordErrors: annotations.length,
    totalStructureErrors: structure.sectionsSummary.missing + structure.sectionsSummary.outOfOrder,
    pages,
  };
}
import { appLogger } from '../utils/logger';

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
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [customTemplateFile, setCustomTemplateFile] = useState<UploadedFile | null>(
    null
  );
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [text, setText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('เชิงวิชาการ');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3. Results states (Requirement 3: Standard text result, Requirement 4 & 5: Document preview & export)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [engineVersion, setEngineVersion] = useState<string | null>(null);
  const [structureResult, setStructureResult] = useState<StructureResult | null>(null);
  const [documentPreviewData, setDocumentPreviewData] = useState<DocumentPreviewData | null>(null);

  // Modals state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [profileStats, setProfileStats] = useState<Awaited<ReturnType<typeof fetchProfileStats>> | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);
  // Temporary development identity; production should replace this with the authenticated subject.
  const userId = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    let active = true;

    // Templates are required to use the editor; history and profile statistics
    // are auxiliary and should not prevent the page from loading.
    fetchTemplates()
      .then((remoteTemplates) => {
        if (!active) return;
        setTemplates(remoteTemplates);
        if (remoteTemplates.length > 0) setSelectedTemplate(remoteTemplates[0]);
        setBackendError(null);
      })
      .catch((error) => {
        if (!active) return;
        appLogger.error('templates_load_failed', { message: error instanceof Error ? error.message : 'unknown' });
        const detail = error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ';
        setBackendError(`ไม่สามารถโหลดข้อมูลจาก Backend ได้ (${detail}) กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่`);
      })
      .finally(() => active && setTemplatesLoading(false));

    fetchHistory(userId)
      .then((remoteHistory) => active && setHistory(remoteHistory))
      .catch((error) => {
        if (active) appLogger.warn('history_load_failed', { message: error instanceof Error ? error.message : 'unknown' });
      });

    fetchProfileStats(userId)
      .then((remoteProfileStats) => active && setProfileStats(remoteProfileStats))
      .catch((error) => {
        if (active) appLogger.warn('profile_stats_load_failed', { message: error instanceof Error ? error.message : 'unknown' });
      });

    return () => { active = false; };
  }, []);

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
    showToast('กรุณาวางข้อความจริงของคุณเพื่อให้ Backend ตรวจสอบ', 'info');
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
    showToast(`ใช้รูปแบบเอกสารเฉพาะ: ${file.name}`, 'success');
  };

  const handleRemoveCustomTemplate = () => {
    setCustomTemplateFile(null);
    setSelectedTemplate(templates[0] || null);
    showToast('เปลี่ยนกลับมาใช้รูปแบบเอกสารมาตรฐาน', 'info');
  };

  // Active effective template (custom template if uploaded, otherwise selected standard template)
  const activeTemplate = selectedTemplate;

  if (!activeTemplate && !templatesLoading) {
    return <div className="min-h-screen p-8 text-center text-rose-700">ไม่พบรูปแบบเอกสารจาก Backend</div>;
  }

  if (!activeTemplate) {
    return <div className="min-h-screen p-8 text-center text-[#5A655E]">กำลังโหลดรูปแบบเอกสาร...</div>;
  }

  // Backend is authoritative for history.
  /*
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
      templateName: checkOptions.compareTemplate ? activeTemplate.name : undefined,
      date: formattedDate,
      wordCount: langRes.wordCount,
      writingStyle: writingStyle,
      originalSnippet: langRes.originalText,
      improvedSnippet: langRes.improvedText,
    };

    setHistory((prev) => [newHistoryItem, ...prev]);
  };
  */

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
      let apiResponse = await submitAnalysis({
        templateId: activeTemplate!.code,
        writingStyle: writingStyle,
        inputMode: inputMode,
        userId,
        text: inputMode === 'text' ? text : undefined,
        file: inputMode === 'file' && uploadedFile?.rawFile ? uploadedFile.rawFile : undefined,
      });

      if (apiResponse.status === 'pending' || apiResponse.status === 'processing') {
        const result = await pollAnalysisJob(apiResponse.jobId, (step) => {
          appLogger.info('analysis_progress', { jobId: apiResponse.jobId, step });
        });
        apiResponse = { jobId: result.jobId, status: 'completed', result };
      }

      if (apiResponse.status === 'completed' && apiResponse.result) {
        const { languageResult, structureResult } = apiResponse.result;
        setAnalysisResult(languageResult);
        setEngineVersion(languageResult.aiReview?.used
          ? `Gemini + PyThaiNLP · ${languageResult.aiReview.model || apiResponse.engineVersion || 'AI'}`
          : apiResponse.engineVersion || null);
        appLogger.info('real_nlp_analysis_completed', {
          engineVersion: apiResponse.engineVersion || 'unknown',
          jobId: apiResponse.jobId,
          issueCount: languageResult.issueCount,
        });
        setStructureResult(structureResult);
        setBackendError(null);

        const docName = apiResponse.result.documentName || (inputMode === 'file' && uploadedFile ? uploadedFile.name : 'ข้อความทั่วไป.txt');
        const contentForPreview = inputMode === 'file' && uploadedFile?.content ? uploadedFile.content : text;
        setDocumentPreviewData(buildApiDocumentPreview(docName, contentForPreview, languageResult, structureResult));

        Promise.all([fetchHistory(userId), fetchProfileStats(userId)]).then(([nextHistory, nextStats]) => {
          setHistory(nextHistory);
          setProfileStats(nextStats);
        }).catch((error) => {
          appLogger.warn('history_refresh_failed', { message: error instanceof Error ? error.message : 'unknown' });
        });

        if (inputMode === 'file') {
          setPageView('document_fullscreen');
          showToast(`[FastAPI + PyThaiNLP] ตรวจรูปแบบเอกสาร ${activeTemplate.name} สำเร็จ`, 'success');
        } else {
          showToast(`[FastAPI + PyThaiNLP] ตรวจวิเคราะห์ข้อความ (${languageResult.score}/100) สำเร็จ`, 'success');
        }
        setIsLoading(false);
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'การตรวจวิเคราะห์ล้มเหลว';
      appLogger.error('analysis_failed', { message });
      setBackendError(message);
      showToast(message, 'error');
      setIsLoading(false);
      return;
    }

    /* Client fallback intentionally disabled: backend is the source of truth. */
    /*
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
          structResult = evaluateStructure(realContent, uploadedFile.name, activeTemplate);
        }
        setDocumentPreviewData(generateDocumentPreview(uploadedFile.name, activeTemplate.name, realContent));
        setPageView('document_fullscreen');
      } else {
        docName = `ข้อความ_${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}.txt`;
        langResult = generateAnalysis(text, writingStyle);
        if (checkOptions.checkStructure) {
          structResult = evaluateStructure(text, undefined, activeTemplate);
        }
        setDocumentPreviewData(generateDocumentPreview(docName, activeTemplate.name, text));
      }

      setAnalysisResult(langResult);
      setStructureResult(structResult);
      recordHistory(docName, langResult, structResult);
      setIsLoading(false);

      if (inputMode === 'file') {
        showToast(`ตรวจเทียบรูปแบบเอกสารกับ "${activeTemplate.name}" เรียบร้อยแล้ว`, 'success');
      } else {
        showToast(`ตรวจวิเคราะห์ข้อความ (${langResult.score}/100) สำเร็จ`, 'success');
      }
    }, 400);
    */
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
      showToast(`โหลดข้อความจากประวัติ "${item.documentName}" แล้ว กดตรวจเพื่อรับผลล่าสุดจาก Backend`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col font-['Prompt',sans-serif]">
      {/* Toast container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
      {backendError && (
        <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            {backendError}
          </div>
        </div>
      )}

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
          <Hero />

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
                  selectedTemplate={activeTemplate}
                  templates={templates}
                  templatesLoading={templatesLoading}
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
                  engineVersion={engineVersion || undefined}
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
        onClearHistory={() => {
          setHistory([]);
          showToast('ล้างประวัติการตรวจเรียบร้อยแล้ว', 'info');
        }}
      />
      <GuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        totalChecks={profileStats?.totalChecks ?? 0}
        averageScore={profileStats?.averageScore}
        engineVersion={profileStats?.engineVersion}
      />
    </div>
  );
};
