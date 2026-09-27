export type InputMode = 'text' | 'file';

export type WritingStyle =
  | 'ทั่วไป'
  | 'เชิงวิชาการ'
  | 'รายงาน'
  | 'บทความ'
  | 'วิทยานิพนธ์';

export interface CategoryCounts {
  spelling: number;
  grammar: number;
  wordUsage: number;
  academic: number;
}

export interface IssueHighlight {
  text: string;
  type: 'spelling' | 'grammar' | 'wordUsage' | 'academic';
  replacement: string;
  reason: string;
}

export interface DetailedBreakdown {
  spelling: string;
  grammar: string;
  wordUsage: string;
  academic: string;
}

export interface AnalysisResult {
  wordCount: number;
  sentenceCount: number;
  issueCount: number;
  score: number;
  categories: CategoryCounts;
  detectedText: string;
  replacement: string;
  reason: string;
  originalText: string;
  improvedText: string;
  detailedBreakdown: DetailedBreakdown;
  highlights?: IssueHighlight[];
}

export interface TemplateSection {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  required: boolean;
  description?: string;
}

export interface TemplateFormattingRules {
  fontFamily: string;
  fontSizeHeading: string;
  fontSizeBody: string;
  margins: string;
  lineSpacing: string;
  pageNumbering: string;
}

export interface DocTemplate {
  id: string;
  name: string;
  shortName?: string;
  code: string;
  category: 'thesis' | 'report' | 'research' | 'proposal' | 'custom';
  description: string;
  university?: string;
  requiredSections: TemplateSection[];
  formattingRules: TemplateFormattingRules;
  isCustom?: boolean;
}

export interface SectionCheckItem {
  id: string;
  title: string;
  level: number;
  status: 'present' | 'missing' | 'out_of_order' | 'warning';
  expectedPosition: number;
  actualPosition?: number;
  note: string;
}

export interface FormattingCheckItem {
  id: string;
  ruleName: string;
  expected: string;
  detected: string;
  status: 'pass' | 'warning' | 'fail' | 'unknown';
  recommendation: string;
}

export interface StructureResult {
  templateName: string;
  templateId: string;
  overallScore: number;
  complianceStatus: 'pass' | 'needs_revision' | 'fail';
  sectionsSummary: {
    total: number;
    matched: number;
    missing: number;
    outOfOrder: number;
  };
  sectionChecks: SectionCheckItem[];
  formattingChecks: FormattingCheckItem[];
  structureRecommendations: string[];
}

export interface UploadedFile {
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  content?: string;
  rawFile?: File;
}

export interface HistoryItem {
  id: string;
  documentName: string;
  score: number;
  structureScore?: number;
  templateName?: string;
  date: string;
  wordCount: number;
  writingStyle?: WritingStyle;
  originalSnippet?: string;
  improvedSnippet?: string;
  jobStatus?: string;
  engineVersion?: string;
}

export interface GuideStep {
  step: number;
  title: string;
  description: string;
  details?: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export interface CheckOptions {
  checkWords: boolean;      // ตรวจคำและไวยากรณ์
  checkStructure: boolean;  // ตรวจโครงสร้าง
  compareTemplate: boolean; // เทียบรูปแบบเอกสาร
}

export interface DocumentAnnotation {
  id: string;
  number?: number;
  type: 'word' | 'structure';
  originalText: string;
  suggestedText?: string;
  comment: string;
  category: 'spelling' | 'grammar' | 'wordUsage' | 'academic' | 'structure_missing' | 'structure_order';
  severity: 'error' | 'warning' | 'info';
}

export interface DocumentPageContent {
  pageNumber: number;
  originalText: string;
  annotatedParagraphs: Array<{
    id: string;
    text: string;
    annotations: DocumentAnnotation[];
  }>;
}

export interface DocumentPreviewData {
  documentName: string;
  pages: DocumentPageContent[];
  totalWordErrors: number;
  totalStructureErrors: number;
}

