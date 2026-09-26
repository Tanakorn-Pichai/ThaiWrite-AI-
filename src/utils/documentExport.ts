import { jsPDF } from 'jspdf';
import { DocumentPreviewData, StructureResult, AnalysisResult } from '../types';

/**
 * Generates and triggers download of a PDF review document
 * Page 1: Document text with numerical reference markers [1], [2], ...
 * Page 2: Dedicated Comments and Corrections Sheet (หน้าแยกของเอกสาร)
 */
export function exportDocumentAsPDF(
  previewData: DocumentPreviewData,
  analysisResult?: AnalysisResult | null,
  structureResult?: StructureResult | null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cleanName = previewData.documentName.replace(/\.[^/.]+$/, '');

  // ==================== PAGE 1: DOCUMENT CONTENT ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ThaiWrite AI - Document Review Report', 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document: ${previewData.documentName}`, 20, 27);
  doc.text(`Reviewed on: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`, 20, 32);

  if (analysisResult) {
    doc.text(`Score: ${analysisResult.score}/100 | Words: ${analysisResult.wordCount}`, 20, 37);
  }

  doc.setDrawColor(0, 98, 65);
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Page 1: Reviewed Document Content (with numbered markers)', 20, 50);

  let y = 60;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  previewData.pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
      y = 25;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Page ${page.pageNumber}: Reviewed Document Content`, 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }

    page.annotatedParagraphs.forEach((p) => {
      let pText = p.text;
      p.annotations.forEach((ann, idx) => {
        const num = ann.number || idx + 1;
        pText = pText.replace(ann.originalText, `[${num}] ${ann.originalText}`);
      });

      const splitLines = doc.splitTextToSize(pText, 170);
      splitLines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 6;
      });
      y += 4;
    });
  });

  // ==================== PAGE 2: SEPARATE COMMENTS SHEET (หน้าแยกของเอกสาร) ====================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Page 2: Review Comments & Recommendations Sheet', 20, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Comments & rationale corresponding to markers [1], [2], ... in Page 1', 20, 26);
  doc.line(20, 30, 190, 30);

  y = 38;
  let itemIndex = 1;
  previewData.pages.forEach((page) => {
    page.annotatedParagraphs.forEach((p) => {
      p.annotations.forEach((ann) => {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        const num = ann.number || itemIndex;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const badge = ann.type === 'word' ? '[WORD ERROR]' : '[STRUCTURE ISSUE]';
        doc.text(`[${num}] ${badge} Original: "${ann.originalText}"`, 20, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (ann.suggestedText) {
          doc.text(`     Suggestion: ${ann.suggestedText}`, 20, y);
          y += 4.5;
        }
        doc.text(`     Comment: ${ann.comment}`, 20, y);
        y += 7;
        itemIndex++;
      });
    });
  });

  doc.save(`[ตรวจแล้ว]_${cleanName}.pdf`);
}

/**
 * Generates and triggers download of a Word document (.docx compatible)
 * with Page 1 content marked with [1], [2] and Page 2 dedicated comments sheet
 */
export function exportDocumentAsDocx(
  previewData: DocumentPreviewData,
  analysisResult?: AnalysisResult | null,
  structureResult?: StructureResult | null
) {
  const cleanName = previewData.documentName.replace(/\.[^/.]+$/, '');

  let htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${cleanName} - ตรวจแก้โดย ThaiWrite AI</title>
  <style>
    body { font-family: 'TH Sarabun New', 'Angsana New', sans-serif; font-size: 16pt; line-height: 1.6; margin: 1.5in 1in 1in 1in; color: #1E2923; }
    h1 { font-size: 20pt; text-align: center; color: #006241; margin-bottom: 24pt; }
    h2 { font-size: 18pt; color: #1E2923; margin-top: 18pt; border-bottom: 1px solid #006241; padding-bottom: 4pt; }
    .header-box { border: 1px solid #006241; background-color: #E2ECE5; padding: 12pt; margin-bottom: 20pt; border-radius: 6pt; }
    .highlight-word { background-color: #FFE5D9; border-bottom: 2px solid #D9534F; color: #9E2A2B; font-weight: bold; }
    .highlight-structure { background-color: #E2ECE5; border-bottom: 2px solid #006241; color: #006241; font-weight: bold; }
    .marker-num { display: inline-block; font-size: 10pt; font-weight: bold; background-color: #006241; color: white; padding: 1pt 4pt; border-radius: 4pt; vertical-align: super; margin-right: 2pt; }
    .marker-num-word { background-color: #D9534F; }
    .page-break { page-break-before: always; margin-top: 30pt; }
    .comment-table { width: 100%; border-collapse: collapse; margin-top: 15pt; }
    .comment-table th, .comment-table td { border: 1px solid #DCE3DD; padding: 8pt 10pt; text-align: left; }
    .comment-table th { background-color: #F4F6F4; color: #1E2923; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header-box">
    <strong>ThaiWrite AI — ผลการตรวจทานเอกสาร</strong><br/>
    ชื่อเอกสาร: ${previewData.documentName}<br/>
    ${analysisResult ? `คะแนนภาษา: ${analysisResult.score}/100 | จำนวนคำ: ${analysisResult.wordCount} คำ<br/>` : ''}
    ${structureResult ? `แม่แบบที่เทียบ: ${structureResult.templateName} (คะแนนโครงสร้าง: ${structureResult.overallScore}/100)<br/>` : ''}
    วันที่ตรวจสอบ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')} น.
  </div>

  <h1>หน้า 1: เนื้อหาเอกสารฉบับตรวจแก้ (${cleanName})</h1>
`;

  // Page 1: Content with [num] markers
  let itemCounter = 1;
  previewData.pages.forEach((page) => {
    page.annotatedParagraphs.forEach((p) => {
      let paraHtml = p.text;
      p.annotations.forEach((ann) => {
        const num = ann.number || itemCounter++;
        const isWord = ann.type === 'word';
        const spanClass = isWord ? 'highlight-word' : 'highlight-structure';
        const numClass = isWord ? 'marker-num marker-num-word' : 'marker-num';
        const replacement = `<span class="${numClass}">[${num}]</span><span class="${spanClass}">${ann.originalText}</span>`;
        if (paraHtml.includes(ann.originalText)) {
          paraHtml = paraHtml.replace(ann.originalText, replacement);
        }
      });
      htmlContent += `<p>${paraHtml}</p>`;
    });
  });

  // Page 2: Dedicated Comments Sheet (หน้าแยกของเอกสาร)
  htmlContent += `
  <div class="page-break">
    <h2>หน้า 2: บันทึกข้อคิดเห็นและรายการตรวจแก้ (Comments Sheet)</h2>
    <p>ตารางรายละเอียดข้อคิดเห็นและการปรับปรุง อ้างอิงตามหมายเลข [1] ถึง [${itemCounter - 1}] ในหน้าเนื้อหา</p>
    
    <table class="comment-table">
      <thead>
        <tr>
          <th style="width: 10%;">หมายเลข</th>
          <th style="width: 20%;">ประเภท</th>
          <th style="width: 25%;">ข้อความเดิม</th>
          <th style="width: 20%;">คำแนะนำแก้ไข</th>
          <th style="width: 25%;">ข้อคิดเห็น / เหตุผล</th>
        </tr>
      </thead>
      <tbody>
  `;

  let tableCounter = 1;
  previewData.pages.forEach((page) => {
    page.annotatedParagraphs.forEach((p) => {
      p.annotations.forEach((ann) => {
        const num = ann.number || tableCounter++;
        htmlContent += `
        <tr>
          <td style="text-align: center; font-weight: bold;">[${num}]</td>
          <td>${ann.type === 'word' ? 'คำผิด / ไวยากรณ์' : 'โครงสร้างเอกสาร'}</td>
          <td style="color: #9E2A2B;">${ann.originalText}</td>
          <td style="color: #006241; font-weight: bold;">${ann.suggestedText || '-'}</td>
          <td>${ann.comment}</td>
        </tr>`;
      });
    });
  });

  htmlContent += `
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `[ตรวจแล้ว]_${cleanName}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export both formats sequentially
 */
export function exportBothFormats(
  previewData: DocumentPreviewData,
  analysisResult?: AnalysisResult | null,
  structureResult?: StructureResult | null
) {
  exportDocumentAsDocx(previewData, analysisResult, structureResult);
  setTimeout(() => {
    exportDocumentAsPDF(previewData, analysisResult, structureResult);
  }, 500);
}
