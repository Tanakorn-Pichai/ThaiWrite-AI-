import { DocumentPreviewData, DocumentAnnotation, DocumentPageContent } from '../types';

/**
 * Common Thai spelling, grammatical, and academic style issue patterns
 */
interface DetectionRule {
  target: string;
  replacement?: string;
  type: 'word' | 'structure';
  category: 'academic' | 'grammar' | 'spelling' | 'structure_missing' | 'structure_order' | 'wordUsage';
  comment: string;
  severity: 'error' | 'warning' | 'info';
}

const DETECTION_RULES: DetectionRule[] = [
  // Spelling (คำสะกดผิด)
  {
    target: 'สัมนา',
    replacement: 'สัมมนา',
    type: 'word',
    category: 'spelling',
    comment: 'คำสะกดผิด: ตามพจนานุกรมฉบับราชบัณฑิตยสถาน สะกดด้วย "ม" 2 ตัว (สัมมนา)',
    severity: 'error',
  },
  {
    target: 'อนุญาติ',
    replacement: 'อนุญาต',
    type: 'word',
    category: 'spelling',
    comment: 'คำสะกดผิด: คำว่า "อนุญาต" ไม่มีสระอิ',
    severity: 'error',
  },
  {
    target: 'กฏเกณฑ์',
    replacement: 'กฎเกณฑ์',
    type: 'word',
    category: 'spelling',
    comment: 'คำสะกดผิด: คำว่า "กฎเกณฑ์" ใช้ ฎ (ชฎา) ไม่ใช่ ฏ (ปฏัก)',
    severity: 'error',
  },
  {
    target: 'กระทันหัน',
    replacement: 'กะทันหัน',
    type: 'word',
    category: 'spelling',
    comment: 'คำสะกดผิด: "กะทันหัน" ไม่มี ร ควบกล้ำ',
    severity: 'error',
  },
  {
    target: 'ผัดวันประกันพรุ่ง',
    replacement: 'ผลัดวันประกันพรุ่ง',
    type: 'word',
    category: 'spelling',
    comment: 'สำนวนสะกดผิด: ต้องใช้ "ผลัด" (มี ล ควบกล้ำ) หมายถึงเลื่อนเวลาออกไป',
    severity: 'error',
  },
  {
    target: 'ลายเซ็นต์',
    replacement: 'ลายเซ็น',
    type: 'word',
    category: 'spelling',
    comment: 'คำสะกดผิด: "ลายเซ็น" ไม่มีไม้ทัณฑฆาต (การันต์) บน น',
    severity: 'error',
  },
  {
    target: 'มุขตลก',
    replacement: 'มุกตลก',
    type: 'word',
    category: 'spelling',
    comment: 'คำสะกดผิด: "มุกตลก" สะกดด้วย ก',
    severity: 'error',
  },
  {
    target: 'ผูกพันธ์',
    replacement: 'ผูกพัน',
    type: 'word',
    category: 'spelling',
    comment: 'คำสะกดผิด: "ผูกพัน" ไม่มี ธ์',
    severity: 'error',
  },
  {
    target: 'สังเกตุ',
    replacement: 'สังเกต',
    type: 'word',
    category: 'spelling',
    comment: 'คำสะกดผิด: "สังเกต" ไม่มีสระอุ',
    severity: 'error',
  },
  {
    target: 'อินเตอร์เน็ต',
    replacement: 'อินเทอร์เน็ต',
    type: 'word',
    category: 'spelling',
    comment: 'คำทับศัพท์: คำว่า "อินเทอร์เน็ต" ตามราชบัณฑิตยสภาใช้ ท ไม่ใช่ ต',
    severity: 'warning',
  },
  {
    target: 'เวปไซต์',
    replacement: 'เว็บไซต์',
    type: 'word',
    category: 'spelling',
    comment: 'คำทับศัพท์: สะกดว่า "เว็บไซต์" (บ ใบไม้)',
    severity: 'warning',
  },

  // Redundant verbs & Grammar (กริยาฟุ่มเฟือยและไวยากรณ์)
  {
    target: 'ทำการส่ง',
    replacement: 'ส่ง',
    type: 'word',
    category: 'grammar',
    comment: 'กริยาฟุ่มเฟือย: ตัด "ทำการ" ออก สามารถใช้คำกริยาหลัก "ส่ง" ได้ทันที',
    severity: 'warning',
  },
  {
    target: 'ทำการวิเคราะห์',
    replacement: 'วิเคราะห์',
    type: 'word',
    category: 'grammar',
    comment: 'กริยาฟุ่มเฟือย: สามารถใช้ "วิเคราะห์" ได้โดยตรงเพื่อให้ประโยคกระชับ',
    severity: 'warning',
  },
  {
    target: 'ทำการวิจัย',
    replacement: 'วิจัย',
    type: 'word',
    category: 'grammar',
    comment: 'กริยาฟุ่มเฟือย: ตัด "ทำการ" ออก เพื่อความกระชับเชิงวิชาการ',
    severity: 'warning',
  },
  {
    target: 'ทำการศึกษา',
    replacement: 'ศึกษา',
    type: 'word',
    category: 'grammar',
    comment: 'กริยาฟุ่มเฟือย: สามารถใช้คำว่า "ศึกษา" ได้ทันที',
    severity: 'warning',
  },
  {
    target: 'ทำการรวบรวม',
    replacement: 'รวบรวม',
    type: 'word',
    category: 'grammar',
    comment: 'กริยาฟุ่มเฟือย: ตัดคำว่า "ทำการ" ออก',
    severity: 'warning',
  },
  {
    target: 'ทำการทดสอบ',
    replacement: 'ทดสอบ',
    type: 'word',
    category: 'grammar',
    comment: 'กริยาฟุ่มเฟือย: ใช้ "ทดสอบ" ได้โดยตรง',
    severity: 'warning',
  },
  {
    target: 'ทำการพัฒนา',
    replacement: 'พัฒนา',
    type: 'word',
    category: 'grammar',
    comment: 'กริยาฟุ่มเฟือย: ตัด "ทำการ" ออก',
    severity: 'warning',
  },
  {
    target: 'ได้ทำการ',
    replacement: 'ได้',
    type: 'word',
    category: 'grammar',
    comment: 'กริยาซ้อนฟุ่มเฟือย: ลดทอนเป็น "ได้" หรือใช้กริยาหลักได้เลย',
    severity: 'warning',
  },
  {
    target: 'มีความต้องการที่จะ',
    replacement: 'ต้องการ',
    type: 'word',
    category: 'wordUsage',
    comment: 'คำฟุ่มเฟือย: รวบคำเป็น "ต้องการ" เพื่อลดความเยิ่นเย้อของประโยค',
    severity: 'warning',
  },
  {
    target: 'มีความจำเป็นอย่างยิ่งที่จะต้อง',
    replacement: 'จำเป็นต้อง',
    type: 'word',
    category: 'wordUsage',
    comment: 'สำนวนฟุ่มเฟือย: รวบคำเป็น "จำเป็นต้อง" เพื่อให้เป็นภาษาวิชาการที่กระชับ',
    severity: 'warning',
  },
  {
    target: 'มีจุดประสงค์เพื่อที่จะ',
    replacement: 'มีวัตถุประสงค์เพื่อ',
    type: 'word',
    category: 'wordUsage',
    comment: 'สำนวนฟุ่มเฟือย: ใช้คำศัพท์เชิงวิชาการ "มีวัตถุประสงค์เพื่อ"',
    severity: 'warning',
  },
  {
    target: 'เพื่อที่จะ',
    replacement: 'เพื่อ',
    type: 'word',
    category: 'wordUsage',
    comment: 'คำเชื่อมฟุ่มเฟือย: ปรับเป็น "เพื่อ"',
    severity: 'warning',
  },
  {
    target: 'เนื่องจากว่า',
    replacement: 'เนื่องจาก',
    type: 'word',
    category: 'wordUsage',
    comment: 'คำเชื่อมฟุ่มเฟือย: ตัด "ว่า" ออก เหลือ "เนื่องจาก"',
    severity: 'warning',
  },
  {
    target: 'ค่อนข้างที่จะ',
    replacement: 'ค่อนข้าง',
    type: 'word',
    category: 'wordUsage',
    comment: 'คำฟุ่มเฟือย: ปรับเป็น "ค่อนข้าง"',
    severity: 'warning',
  },

  // Academic tone & spoken words (ภาษาพูดและระดับภาษา)
  {
    target: 'เยอะแยะ',
    replacement: 'จำนวนมาก',
    type: 'word',
    category: 'academic',
    comment: 'ภาษาพูด / ไม่เป็นทางการ: ควรเปลี่ยนเป็น "จำนวนมาก" หรือ "หลากหลายประการ"',
    severity: 'warning',
  },
  {
    target: 'ในส่วนของ',
    replacement: 'สำหรับ',
    type: 'word',
    category: 'academic',
    comment: 'คำเชื่อมกึ่งภาษาพูด: ปรับเป็น "สำหรับ" หรือ "ในด้าน"',
    severity: 'info',
  },
  {
    target: 'ในเรื่องของ',
    replacement: 'ด้าน',
    type: 'word',
    category: 'academic',
    comment: 'ภาษาพูด: ควรปรับเป็นคำทางการ เช่น "ด้าน" หรือ "ประเด็น"',
    severity: 'info',
  },
  {
    target: 'มากๆ',
    replacement: 'อย่างยิ่ง',
    type: 'word',
    category: 'academic',
    comment: 'หลีกเลี่ยงไม้ยมกในงานวิชาการ: ควรใช้ "อย่างยิ่ง" หรือ "เป็นอย่างมาก"',
    severity: 'warning',
  },
  {
    target: 'จริงๆ',
    replacement: 'แท้จริง',
    type: 'word',
    category: 'academic',
    comment: 'ภาษาพูด: ควรปรับเป็น "แท้จริง" หรือ "ตามความเป็นจริง"',
    severity: 'warning',
  },
];

/**
 * Default sample text used when user hasn't typed anything
 */
const DEFAULT_SAMPLE_CONTENT = `บทที่ 1 บทนำ
1.1 ความเป็นมาและความสำคัญของปัญหา
ในปัจจุบันการเขียนเอกสารทางวิชาการและรายงานโครงงานของนักศึกษาในระดับอุดมศึกษายังพบปัญหาข้อผิดพลาดด้านไวยากรณ์ การสะกดคำ และการใช้โครงสร้างที่ไม่ตรงตามแบบแผนมาตรฐานของมหาวิทยาลัย ซึ่งส่งผลกระทบต่อคุณภาพและความน่าเชื่อถือของผลงานวิชาการเป็นอย่างยิ่ง
การประมวลผลภาษาธรรมชาตินั้น มีความจำเป็นอย่างยิ่งที่ผู้วิจัยจะต้องมีความต้องการที่จะทำการวิเคราะห์คลังข้อมูลภาษาไทยอย่างเป็นระบบ เพื่อนำมาพัฒนาแบบจำลองปัญญาประดิษฐ์ที่มีประสิทธิภาพสูง

บทที่ 2 วรรณกรรมและงานวิจัยที่เกี่ยวข้อง
2.1 ทฤษฎีการประมวลผลภาษาธรรมชาติภาษาไทย
การตัดคำภาษาไทยมีความซับซ้อนเนื่องจากภาษาไทยไม่มีการเว้นวรรคระหว่างคำ จึงเกิดความยุ่งยากเยอะแยะในการกำหนดขอบเขตคำอย่างถูกต้องแม่นยำ
ในการนี้ ผู้วิจัยได้เข้าร่วมงานสัมนาวิชาการระดับชาติเพื่อแลกเปลี่ยนองค์ความรู้เกี่ยวกับสถาปัตยกรรมแบบ Transformer และนำผลการประเมินมาปรับปรุงประสิทธิภาพของระบบ

บทที่ 3 วิธีดำเนินการวิจัย
3.1 แหล่งข้อมูลและการรวบรวมคลังข้อมูล
คณะผู้วิจัยได้ทำการรวบรวมคลังข้อมูลเอกสารทางวิชาการจากฐานข้อมูลงานวิจัยภาษาไทยจำนวน 5,000 บทความ และทำการแบ่งข้อมูลออกเป็นชุดฝึกและชุดทดสอบในอัตราส่วน 80:20 ตามลำดับ`;

/**
 * Filter out any raw PDF internal binary syntax (e.g. %PDF-1.7, 1 0 obj, /Type)
 */
function sanitizeInputText(rawText: string): string {
  if (!rawText) return '';
  const lines = rawText.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^%PDF-/i.test(trimmed)) return false;
    if (/^\d+\s+\d+\s+obj/i.test(trimmed)) return false;
    if (/^endobj/i.test(trimmed)) return false;
    if (/^xref/i.test(trimmed)) return false;
    if (/^trailer/i.test(trimmed)) return false;
    if (/^startxref/i.test(trimmed)) return false;
    if (/^stream/i.test(trimmed)) return false;
    if (/^endstream/i.test(trimmed)) return false;
    if (/^\/(Type|Pages|Catalog|Font|Encoding|Length|Filter|ProcSet|MediaBox)/i.test(trimmed)) return false;
    if (trimmed === 'Type' || trimmed === 'obj') return false;
    return true;
  });
  return lines.join('\n\n').trim();
}

/**
 * Generates realistic multi-page document preview data using THE ACTUAL USER TEXT or uploaded file
 */
export function generateDocumentPreview(
  docName: string = 'รายงานโครงงาน_ปัญญาประดิษฐ์.docx',
  templateName?: string,
  actualContent?: string
): DocumentPreviewData {
  const sanitized = sanitizeInputText(actualContent || '');
  const content = sanitized.length > 20
    ? sanitized
    : DEFAULT_SAMPLE_CONTENT;

  // Split raw content into paragraphs
  const rawParagraphs = content
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Group paragraphs into A4 pages (approx 2 to 3 substantive paragraphs per page)
  const PARAGRAPHS_PER_PAGE = 3;
  const pageChunks: string[][] = [];
  
  for (let i = 0; i < rawParagraphs.length; i += PARAGRAPHS_PER_PAGE) {
    pageChunks.push(rawParagraphs.slice(i, i + PARAGRAPHS_PER_PAGE));
  }

  // Ensure at least 1 page
  if (pageChunks.length === 0) {
    pageChunks.push([content]);
  }

  let globalAnnotationCounter = 1;
  let totalWordErrors = 0;
  let totalStructureErrors = 0;

  const pages: DocumentPageContent[] = pageChunks.map((paraList, pageIdx) => {
    const pageNumber = pageIdx + 1;
    const pageOriginalText = paraList.join('\n\n');

    const annotatedParagraphs = paraList.map((paraText, pIdx) => {
      const annotations: DocumentAnnotation[] = [];
      const paraId = `p${pageNumber}_${pIdx}`;

      // Check detection rules against this actual paragraph
      for (const rule of DETECTION_RULES) {
        if (paraText.includes(rule.target)) {
          // Avoid duplicate annotation on same target in single paragraph
          if (!annotations.some((a) => a.originalText === rule.target)) {
            annotations.push({
              id: `ann-${pageNumber}-${pIdx}-${globalAnnotationCounter}`,
              number: globalAnnotationCounter,
              type: rule.type,
              originalText: rule.target,
              suggestedText: rule.replacement,
              comment: rule.comment,
              category: rule.category,
              severity: rule.severity,
            });
            globalAnnotationCounter++;
            if (rule.type === 'word') totalWordErrors++;
            else totalStructureErrors++;
          }
        }
      }

      // Check for template section headings in text
      if (pageIdx === 0 && pIdx === 0 && !paraText.includes('บทนำ')) {
        // If first page misses standard introduction heading
        annotations.push({
          id: `ann-struct-intro-${globalAnnotationCounter}`,
          number: globalAnnotationCounter,
          type: 'structure',
          originalText: paraText.slice(0, Math.min(30, paraText.length)),
          suggestedText: 'จัดหมวดหมู่ให้มีหัวข้อ "บทที่ 1 บทนำ"',
          comment: `โครงสร้าง: ตามแม่แบบ ${templateName || 'มาตรฐาน'} ควรเปิดเอกสารด้วยส่วนนำหรือ "บทที่ 1 บทนำ"`,
          category: 'structure_missing',
          severity: 'error',
        });
        globalAnnotationCounter++;
        totalStructureErrors++;
      }

      return {
        id: paraId,
        text: paraText,
        annotations,
      };
    });

    return {
      pageNumber,
      originalText: pageOriginalText,
      annotatedParagraphs,
    };
  });

  // If no errors were detected at all in user's text, add one helpful academic formatting suggestion
  if (totalWordErrors === 0 && totalStructureErrors === 0 && pages.length > 0) {
    const firstP = pages[0].annotatedParagraphs[0];
    if (firstP && firstP.text.length > 10) {
      const sampleSnippet = firstP.text.slice(0, Math.min(25, firstP.text.length));
      firstP.annotations.push({
        id: `ann-general-${globalAnnotationCounter}`,
        number: 1,
        type: 'word',
        originalText: sampleSnippet,
        suggestedText: sampleSnippet,
        comment: 'ข้อความถูกต้องตามหลักไวยากรณ์ ตรวจสอบการเว้นวรรคและการจัดย่อหน้า 1.5 นิ้ว ตามระเบียบเอกสารวิชาการ',
        category: 'academic',
        severity: 'info',
      });
      totalWordErrors = 1;
    }
  }

  return {
    documentName: docName,
    totalWordErrors,
    totalStructureErrors,
    pages,
  };
}
