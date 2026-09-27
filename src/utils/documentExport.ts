import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  PageBreak,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from 'docx';
import { DocumentAnnotation, DocumentPreviewData, StructureResult, AnalysisResult } from '../types';

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getAnnotations = (previewData: DocumentPreviewData): DocumentAnnotation[] => (
  previewData.pages.flatMap((page) =>
    page.annotatedParagraphs.flatMap((paragraph) => paragraph.annotations || [])
  )
);

const markerNumber = (annotation: DocumentAnnotation, fallback: number) => (
  annotation.number || fallback
);

/** Render one paragraph with the same marker/highlight treatment as the preview. */
function renderReviewedParagraph(
  text: string,
  annotations: DocumentAnnotation[],
  fallbackNumber: { value: number },
): string {
  if (!annotations.length) return escapeHtml(text);

  let remaining = text;
  let html = '';
  const sorted = [...annotations].sort((a, b) => text.indexOf(a.originalText) - text.indexOf(b.originalText));

  sorted.forEach((annotation) => {
    const targetIndex = remaining.indexOf(annotation.originalText);
    if (targetIndex < 0) return;

    html += escapeHtml(remaining.slice(0, targetIndex));
    const number = markerNumber(annotation, ++fallbackNumber.value);
    const isWord = annotation.type === 'word';
    const markerClass = isWord ? 'review-marker review-marker-word' : 'review-marker';
    const highlightClass = isWord ? 'review-highlight review-highlight-word' : 'review-highlight';
    html += `<span class="${markerClass}"><span class="review-marker-number">[${number}]</span><span class="${highlightClass}">${escapeHtml(annotation.originalText)}</span></span>`;
    remaining = remaining.slice(targetIndex + annotation.originalText.length);
  });

  return html + escapeHtml(remaining);
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function renderCommentCard(annotation: DocumentAnnotation, index: number): string {
  const number = markerNumber(annotation, index + 1);
  return `<article class="review-comment"><div class="review-comment-header"><span class="comment-number">[${number}]</span><strong>${annotation.type === 'word' ? 'คำผิด / ไวยากรณ์' : 'โครงสร้างเอกสาร'}</strong></div><div class="comment-grid"><div class="comment-original"><small>ข้อความเดิม</small><span>${escapeHtml(annotation.originalText)}</span></div><div class="comment-suggestion"><small>คำแนะนำแก้ไข</small><span>${escapeHtml(annotation.suggestedText || '-')}</span></div></div><p class="comment-reason"><strong>คำอธิบาย:</strong> ${escapeHtml(annotation.comment)}</p></article>`;
}

function renderCommentsPages(annotations: DocumentAnnotation[]): string {
  const pages = chunkItems(annotations, 5);
  if (!pages.length) pages.push([]);
  return pages.map((page, pageIndex) => `<section class="comments-page"><h2 class="comments-title">บันทึกข้อคิดเห็นและรายการตรวจแก้</h2><p class="comments-subtitle">หน้า ${pageIndex + 1} | รายละเอียดอ้างอิงตามหมายเลขที่แสดงบนข้อความฉบับตรวจแก้</p>${page.length ? page.map((annotation, index) => renderCommentCard(annotation, pageIndex * 5 + index)).join('') : '<p>ไม่พบข้อคิดเห็นเพิ่มเติม</p>'}</section>`).join('');
}

function statusLabel(status: string): string {
  if (status === 'present' || status === 'pass') return 'ผ่าน';
  if (status === 'missing' || status === 'fail') return 'ไม่ผ่าน';
  if (status === 'out_of_order') return 'สลับลำดับ';
  return 'ควรปรับปรุง';
}

function renderStructurePages(structureResult: StructureResult | null | undefined): string {
  if (!structureResult) return '';
  const { sectionsSummary, sectionChecks, formattingChecks, structureRecommendations } = structureResult;
  const pages: string[] = [];
  pages.push(`<section class="structure-page"><h2 class="comments-title">รายงานตรวจรูปแบบเอกสาร</h2><p class="comments-subtitle">${escapeHtml(structureResult.templateName)} | สถานะ: ${statusLabel(structureResult.complianceStatus)}</p><div class="structure-summary"><strong>คะแนนโครงสร้าง: ${structureResult.overallScore}/100</strong><span>ครบ ${sectionsSummary.matched}</span><span>ขาด ${sectionsSummary.missing}</span><span>สลับลำดับ ${sectionsSummary.outOfOrder}</span></div><h3 class="structure-heading">สรุปการตรวจ</h3><p class="structure-note">ตรวจทั้งหมด ${sectionsSummary.total} หัวข้อ ตามลำดับและเกณฑ์ของรูปแบบเอกสาร</p></section>`);
  chunkItems(sectionChecks, 6).forEach((chunk, pageIndex) => pages.push(`<section class="structure-page"><h2 class="comments-title">รายการหัวข้อตามรูปแบบเอกสาร</h2><p class="comments-subtitle">หน้า ${pageIndex + 1} | ${escapeHtml(structureResult.templateName)}</p>${chunk.map((section) => `<article class="structure-item"><div><strong>${escapeHtml(section.title)}</strong><small>ลำดับ #${section.expectedPosition} | ${escapeHtml(section.note)}</small></div><span class="status-badge status-${section.status}">${statusLabel(section.status)}</span></article>`).join('')}</section>`));
  chunkItems(formattingChecks, 4).forEach((chunk, pageIndex) => pages.push(`<section class="structure-page"><h2 class="comments-title">การจัดหน้าและรูปแบบ</h2><p class="comments-subtitle">หน้า ${pageIndex + 1} | แบบอักษร ระยะขอบ เลขหน้า และระยะบรรทัด</p>${chunk.map((rule) => `<article class="structure-item structure-item-block"><div><strong>${escapeHtml(rule.ruleName)}</strong><small>เกณฑ์: ${escapeHtml(rule.expected)}</small><small>ที่ตรวจพบ: ${escapeHtml(rule.detected)}</small><small>คำแนะนำ: ${escapeHtml(rule.recommendation)}</small></div><span class="status-badge status-${rule.status}">${statusLabel(rule.status)}</span></article>`).join('')}</section>`));
  chunkItems(structureRecommendations, 6).forEach((chunk, pageIndex) => pages.push(`<section class="structure-page"><h2 class="comments-title">ข้อเสนอแนะการปรับปรุง</h2><p class="comments-subtitle">หน้า ${pageIndex + 1} | ${escapeHtml(structureResult.templateName)}</p>${chunk.map((recommendation, index) => `<article class="recommendation-item"><span>${pageIndex * 6 + index + 1}</span><p>${escapeHtml(recommendation)}</p></article>`).join('')}</section>`));
  return pages.join('');
}

function buildReviewStyles(): string {
  return `
    * { box-sizing: border-box; }
    body { margin: 0; color: #1E2923; font-family: Prompt, 'TH Sarabun New', Arial, sans-serif; }
    .review-page { width: 794px; height: 1123px; padding: 58px 64px; background: #fff; page-break-after: always; overflow: hidden; }
    .review-title { color: #006241; font-size: 24px; font-weight: 700; margin: 0 0 8px; }
    .review-meta { color: #5A655E; font-size: 13px; border-bottom: 1px solid #DCE3DD; padding-bottom: 10px; margin-bottom: 24px; }
    .review-body { font-size: 16px; line-height: 1.8; }
    .review-body p { margin: 0 0 18px; white-space: pre-wrap; }
    .review-marker { position: relative; display: inline-block; margin: 0 2px; padding-top: 13px; vertical-align: baseline; }
    .review-marker-number { position: absolute; top: 0; left: 50%; transform: translateX(-50%); color: #fff; background: #006241; border-radius: 9px; padding: 1px 5px; font: 700 10px Arial, sans-serif; line-height: 14px; white-space: nowrap; }
    .review-marker-word .review-marker-number { background: #D9534F; }
    .review-highlight { background: #DFF4E8; border-bottom: 3px solid #006241; border-radius: 3px; padding: 1px 4px; font-weight: 600; }
    .review-highlight-word { background: #FFE5D9; border-bottom-color: #D9534F; }
    .comments-page, .structure-page { width: 794px; height: 1123px; padding: 58px 64px; background: #fff; page-break-after: always; overflow: hidden; }
    .comments-title { color: #006241; font-size: 22px; font-weight: 700; margin: 0 0 8px; }
    .comments-subtitle { color: #5A655E; font-size: 13px; margin: 0 0 22px; }
    .review-comment { border: 1px solid #DCE3DD; border-radius: 10px; padding: 13px; margin-bottom: 12px; break-inside: avoid; }
    .review-comment-header { display: flex; align-items: center; gap: 8px; color: #006241; font-size: 13px; margin-bottom: 8px; }
    .comment-number { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 22px; border-radius: 11px; background: #006241; color: #fff; font: 700 11px Arial, sans-serif; }
    .comment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .comment-grid > div { padding: 8px; border-radius: 6px; font-size: 13px; }
    .comment-grid small { display: block; color: #5A655E; font-size: 10px; margin-bottom: 4px; }
    .comment-original { background: #FFF1ED; border: 1px solid #F2C5B8; color: #9E2A2B; }
    .comment-suggestion { background: #E2ECE5; border: 1px solid #B7D8C4; color: #006241; font-weight: 700; }
    .comment-reason { color: #5A655E; font-size: 12px; line-height: 1.5; margin: 9px 0 0; }
    .structure-summary { display: flex; gap: 10px; flex-wrap: wrap; margin: 18px 0; }
    .structure-summary span, .structure-summary strong { padding: 8px 10px; border: 1px solid #DCE3DD; border-radius: 7px; font-size: 13px; }
    .structure-summary strong { color: #006241; background: #E2ECE5; }
    .structure-heading { color: #006241; font-size: 17px; margin: 24px 0 8px; }
    .structure-note { color: #5A655E; font-size: 13px; }
    .structure-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; border: 1px solid #DCE3DD; border-radius: 8px; padding: 10px; margin-bottom: 9px; font-size: 13px; }
    .structure-item-block { align-items: flex-start; }
    .structure-item strong, .structure-item small { display: block; }
    .structure-item small { color: #5A655E; line-height: 1.45; margin-top: 3px; }
    .status-badge { flex: 0 0 auto; border-radius: 5px; padding: 4px 7px; font-size: 11px; font-weight: 700; background: #F4F6F4; }
    .status-present, .status-pass { color: #006241; background: #E2ECE5; }
    .status-missing, .status-fail { color: #9E2A2B; background: #FFE5D9; }
    .status-out_of_order, .status-warning { color: #8A5A00; background: #FFF4D6; }
    .recommendation-item { display: flex; gap: 10px; align-items: flex-start; padding: 11px; border: 1px solid #DCE3DD; border-radius: 8px; margin-bottom: 10px; font-size: 13px; }
    .recommendation-item span { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 12px; color: #006241; background: #E2ECE5; font-weight: 700; }
    .recommendation-item p { margin: 2px 0 0; line-height: 1.5; }
  `;
}

function buildReviewHtml(
  previewData: DocumentPreviewData,
  analysisResult?: AnalysisResult | null,
  structureResult?: StructureResult | null,
): string {
  const annotations = getAnnotations(previewData);
  const fallbackNumber = { value: 0 };
  const contentPages = previewData.pages.map((page) => {
    const paragraphs = page.annotatedParagraphs.map((paragraph) => (
      `<p>${renderReviewedParagraph(paragraph.text, paragraph.annotations || [], fallbackNumber)}</p>`
    )).join('');
    return `<section class="review-page"><h1 class="review-title">ฉบับตรวจแก้: ${escapeHtml(previewData.documentName)}</h1><div class="review-meta">หน้า ${page.pageNumber} | ${analysisResult ? `คะแนนภาษา ${analysisResult.score}/100` : ''}${structureResult ? ` | คะแนนโครงสร้าง ${structureResult.overallScore}/100` : ''}</div><main class="review-body">${paragraphs}</main></section>`;
  }).join('');
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><style>${buildReviewStyles()}</style></head><body>${contentPages}${renderCommentsPages(annotations)}${renderStructurePages(structureResult)}</body></html>`;
}

function textRun(text: string, options: Record<string, unknown> = {}): TextRun {
  return new TextRun({ text, ...options } as never);
}

function reviewedRuns(paragraph: string, annotations: DocumentAnnotation[], fallbackNumber: { value: number }): TextRun[] {
  if (!annotations.length) return [textRun(paragraph)];
  const runs: TextRun[] = [];
  let remaining = paragraph;
  annotations.forEach((annotation) => {
    const index = remaining.indexOf(annotation.originalText);
    if (index < 0) return;
    if (index) runs.push(textRun(remaining.slice(0, index)));
    const number = markerNumber(annotation, ++fallbackNumber.value);
    const color = annotation.type === 'word' ? '9E2A2B' : '006241';
    runs.push(textRun(`[${number}]`, { superScript: true, color, bold: true }));
    runs.push(textRun(annotation.originalText, { bold: true, color, shading: { type: ShadingType.SOLID, color: annotation.type === 'word' ? 'FFE5D9' : 'DFF4E8' } }));
    remaining = remaining.slice(index + annotation.originalText.length);
  });
  if (remaining) runs.push(textRun(remaining));
  return runs;
}

/** Generate a Thai-capable PDF with highlighted reviewed pages and comments. */
export async function exportDocumentAsPDF(
  previewData: DocumentPreviewData,
  analysisResult?: AnalysisResult | null,
  structureResult?: StructureResult | null,
) {
  const cleanName = previewData.documentName.replace(/\.[^/.]+$/, '');
  const staging = globalThis.document.createElement('div');
  staging.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;';
  staging.innerHTML = buildReviewHtml(previewData, analysisResult, structureResult);
  globalThis.document.body.appendChild(staging);
  try {
    await globalThis.document.fonts?.ready;
    const pages = Array.from(staging.children) as HTMLElement[];
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await html2canvas(pages[index], { scale: 2, backgroundColor: '#ffffff', width: 794, height: 1123 });
      if (index > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
    }
    pdf.save(`[ตรวจแล้ว]_${cleanName}.pdf`);
  } finally {
    staging.remove();
  }
}

/** Generate a real OOXML DOCX file, not HTML renamed to .docx. */
export async function exportDocumentAsDocx(
  previewData: DocumentPreviewData,
  analysisResult?: AnalysisResult | null,
  structureResult?: StructureResult | null,
) {
  const cleanName = previewData.documentName.replace(/\.[^/.]+$/, '');
  const annotations = getAnnotations(previewData);
  const fallbackNumber = { value: 0 };
  const children: Array<Paragraph | Table> = [];
  children.push(new Paragraph({ text: 'ThaiWrite AI — เอกสารฉบับตรวจแก้', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ text: `ชื่อเอกสาร: ${previewData.documentName}` }));
  if (analysisResult) children.push(new Paragraph({ text: `คะแนนภาษา: ${analysisResult.score}/100 | จำนวนคำ: ${analysisResult.wordCount}` }));

  previewData.pages.forEach((page, pageIndex) => {
    children.push(new Paragraph({ children: [textRun(`หน้า ${page.pageNumber}`, { bold: true, color: '006241' })] }));
    page.annotatedParagraphs.forEach((paragraph) => children.push(new Paragraph({ children: reviewedRuns(paragraph.text, paragraph.annotations || [], fallbackNumber) })));
    if (pageIndex < previewData.pages.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: 'บันทึกข้อคิดเห็นและรายการตรวจแก้', heading: HeadingLevel.HEADING_1 }));
  chunkItems(annotations, 5).forEach((chunk, pageIndex) => {
    chunk.forEach((annotation, index) => {
      const number = markerNumber(annotation, pageIndex * 5 + index + 1);
      children.push(new Paragraph({ children: [textRun(`[${number}] ${annotation.type === 'word' ? 'คำผิด / ไวยากรณ์' : 'โครงสร้างเอกสาร'}`, { bold: true, color: '006241' })] }));
      children.push(new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: `ข้อความเดิม: ${annotation.originalText}` })] }), new TableCell({ children: [new Paragraph({ text: `คำแนะนำ: ${annotation.suggestedText || '-'}` })] })] })], borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'DCE3DD' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DCE3DD' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'DCE3DD' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'DCE3DD' }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'DCE3DD' }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'DCE3DD' } } }));
      children.push(new Paragraph({ text: `คำอธิบาย: ${annotation.comment}` }));
    });
    if (pageIndex < Math.ceil(annotations.length / 5) - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  });

  if (structureResult) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ text: 'รายงานตรวจรูปแบบเอกสาร', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: `${structureResult.templateName} | คะแนนโครงสร้าง ${structureResult.overallScore}/100` }));
    children.push(new Paragraph({ text: `หัวข้อครบ ${structureResult.sectionsSummary.matched} | ขาด ${structureResult.sectionsSummary.missing} | สลับ ${structureResult.sectionsSummary.outOfOrder}` }));
    children.push(new Paragraph({ text: 'รายการหัวข้อ', heading: HeadingLevel.HEADING_2 }));
    structureResult.sectionChecks.forEach((section) => children.push(new Paragraph({ text: `[${statusLabel(section.status)}] ${section.title} — ${section.note}` })));
    children.push(new Paragraph({ text: 'การจัดหน้าและรูปแบบ', heading: HeadingLevel.HEADING_2 }));
    structureResult.formattingChecks.forEach((rule) => children.push(new Paragraph({ text: `[${statusLabel(rule.status)}] ${rule.ruleName} — ${rule.detected}` })));
    children.push(new Paragraph({ text: 'ข้อเสนอแนะ', heading: HeadingLevel.HEADING_2 }));
    structureResult.structureRecommendations.forEach((recommendation, index) => children.push(new Paragraph({ text: `${index + 1}. ${recommendation}` })));
  }

  const docxDocument = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(docxDocument);
  const url = URL.createObjectURL(blob);
  const link = globalThis.document.createElement('a');
  link.href = url;
  link.download = `[ตรวจแล้ว]_${cleanName}.docx`;
  globalThis.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportBothFormats(
  previewData: DocumentPreviewData,
  analysisResult?: AnalysisResult | null,
  structureResult?: StructureResult | null,
) {
  await exportDocumentAsDocx(previewData, analysisResult, structureResult);
  await exportDocumentAsPDF(previewData, analysisResult, structureResult);
}
