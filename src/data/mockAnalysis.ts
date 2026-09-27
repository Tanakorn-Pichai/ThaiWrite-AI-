import { AnalysisResult, WritingStyle } from '../types';

export const SAMPLE_TEXT = 'นักศึกษามีความต้องการที่จะทำการส่งรายงานภายในวันพรุ่งนี้';

export const DEFAULT_MOCK_ANALYSIS: AnalysisResult = {
  wordCount: 1248,
  sentenceCount: 86,
  issueCount: 5,
  score: 87,
  categories: {
    spelling: 1,
    grammar: 2,
    wordUsage: 1,
    academic: 1,
  },
  detectedText: 'ทำการส่ง',
  replacement: 'ส่ง',
  reason: 'คำว่า "ทำการส่ง" สามารถใช้คำว่า "ส่ง" ได้โดยตรง ทำให้ประโยคกระชับและเหมาะกับงานเขียนเชิงวิชาการ',
  originalText: 'นักศึกษามีความต้องการที่จะทำการส่งรายงานภายในวันพรุ่งนี้',
  improvedText: 'นักศึกษาต้องการส่งรายงานภายในวันพรุ่งนี้',
  detailedBreakdown: {
    spelling: 'พบคำสะกดผิดตามบริบท เช่น การพิมพ์ "ขออนุญาติ" ควรปรับเป็น "ขออนุญาต" ให้ถูกต้องตามพจนานุกรมฉบับราชบัณฑิตยสถาน',
    grammar: 'พบการใช้คำฟุ่มเฟือยและคำซ้ำซ้อน เช่น "ได้ทำการส่ง...แล้วเรียบร้อยแล้ว" ควรลดทอนคำซ้ำซ้อน',
    wordUsage: 'พบการใช้คำเชื่อมเยิ่นเย้อ เช่น "มีความต้องการที่จะ" ควรใช้คำว่า "ต้องการ"',
    academic: 'พบภาษาพูดไม่เหมาะสม เช่น "เยอะแยะ" ควรเปลี่ยนเป็น "จำนวนมาก" ให้เหมาะกับระดับภาษาวิชาการ',
  },
  highlights: [
    {
      text: 'มีความต้องการที่จะ',
      type: 'wordUsage',
      replacement: 'ต้องการ',
      reason: 'รวบคำเป็น "ต้องการ" เพื่อลดความซ้ำซ้อนของโครงสร้างประโยค',
    },
    {
      text: 'ทำการส่ง',
      type: 'grammar',
      replacement: 'ส่ง',
      reason: 'ตัดกริยาช่วยฟุ่มเฟือย "ทำการ" ออก เพื่อให้กระชับเชิงวิชาการ',
    },
  ],
};

/**
 * Generate analysis results tailored to user text input or uploaded file
 * Covers 4 Core Categories:
 * 1. คำสะกดผิดตามบริบท (Contextual Spelling)
 * 2. คำฟุ่มเฟือยและคำซ้ำซ้อน (Redundant & Repetitive Words)
 * 3. ระดับภาษาไม่เหมาะสม (Inappropriate Academic Tone)
 * 4. โครงสร้างประโยคไม่สมบูรณ์ (Incomplete Sentence Structure)
 */
export function generateAnalysis(
  text: string,
  style: WritingStyle,
  fileName?: string
): AnalysisResult {
  // Sanitize any raw PDF binary artifacts
  const sanitizedLines = (text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^%PDF-/i.test(l) && !/^\d+\s+\d+\s+obj/i.test(l) && l !== 'Type' && l !== 'obj');
  const sanitizedText = sanitizedLines.join('\n');
  const trimmed = sanitizedText.trim();

  // If it's empty
  if (!trimmed) {
    return {
      ...DEFAULT_MOCK_ANALYSIS,
      issueCount: 0,
      score: 100,
      detectedText: '',
      replacement: '',
      reason: 'ไม่มีข้อความสำหรับตรวจสอบ',
      originalText: '',
      improvedText: '',
      highlights: [],
    };
  }

  // Calculate approximate words and sentences for Thai text
  const spaceSeparated = trimmed.split(/\s+/).filter(Boolean);
  const approxWords = Math.max(
    spaceSeparated.length > 5 ? spaceSeparated.length : Math.round(trimmed.length / 4.2),
    8
  );
  const sentenceEstimate = Math.max(Math.round(approxWords / 14), 1);

  // Expanded Rule Engine covering the 4 categories
  const patterns = [
    // ────────────────────────────────────────────────────────
    // หมวดที่ 1: คำสะกดผิดตามบริบท (Contextual Spelling Errors)
    // ────────────────────────────────────────────────────────
    { target: 'ขออนุญาติ', replacement: 'ขออนุญาต', type: 'spelling' as const, reason: 'คำว่า "ขออนุญาต" สะกดโดยไม่มีสระอิ ตามพจนานุกรมราชบัณฑิตยสถาน' },
    { target: 'อนุญาติ', replacement: 'อนุญาต', type: 'spelling' as const, reason: 'คำว่า "อนุญาต" สะกดโดยไม่มีสระอิ ตามพจนานุกรมราชบัณฑิตยสถาน' },
    { target: 'สังเกตุ', replacement: 'สังเกต', type: 'spelling' as const, reason: 'คำว่า "สังเกต" สะกดโดยไม่มีสระอุ' },
    { target: 'กฏหมาย', replacement: 'กฎหมาย', type: 'spelling' as const, reason: 'ใช้ ฎ (ชฎา) สะกดกฎหมาย ไม่ใช่ ฏ (ปฏัก)' },
    { target: 'กฏเกณฑ์', replacement: 'กฎเกณฑ์', type: 'spelling' as const, reason: 'ใช้ ฎ (ชฎา) ในคำว่า "กฎเกณฑ์"' },
    { target: 'กฏระเบียบ', replacement: 'กฎระเบียบ', type: 'spelling' as const, reason: 'ใช้ ฎ (ชฎา) ในคำว่า "กฎระเบียบ"' },
    { target: 'กระทันหัน', replacement: 'กะทันหัน', type: 'spelling' as const, reason: 'คำที่ถูกต้องคือ "กะทันหัน" (ไม่มี ร.เรือ)' },
    { target: 'ผัดวันประกันพรุ่ง', replacement: 'ผลัดวันประกันพรุ่ง', type: 'spelling' as const, reason: 'ใช้ "ผลัด" (เลื่อนเวลา) ไม่ใช่ "ผัด" (อาหาร)' },
    { target: 'สัมนา', replacement: 'สัมมนา', type: 'spelling' as const, reason: 'สะกดว่า "สัมมนา" มี ม.ม้า 2 ตัว' },
    { target: 'ลายเซ็นต์', replacement: 'ลายเซ็น', type: 'spelling' as const, reason: 'คำว่า "ลายเซ็น" ไม่มี ต์ การันต์' },
    { target: 'เวบไซต์', replacement: 'เว็บไซต์', type: 'spelling' as const, reason: 'สะกดทับศัพท์ว่า "เว็บไซต์" ด้วย ว.แหวน และ ศ.ศาลา' },
    { target: 'เวบไซด์', replacement: 'เว็บไซต์', type: 'spelling' as const, reason: 'สะกดทับศัพท์ว่า "เว็บไซต์"' },
    { target: 'อินเตอร์เนต', replacement: 'อินเทอร์เน็ต', type: 'spelling' as const, reason: 'สะกดคำทับศัพท์ด้วย ท.ทหาร และมีไม้ไต่คู้' },
    { target: 'กราฟฟิก', replacement: 'กราฟิก', type: 'spelling' as const, reason: 'คำทับศัพท์ "กราฟิก" ใช้ ฟ.ฟัน ตัวเดียว' },
    { target: 'ออฟฟิส', replacement: 'ออฟฟิศ', type: 'spelling' as const, reason: 'ใช้ ศ.ศาลา เป็นตัวสะกด' },
    { target: 'โควต้า', replacement: 'โควตา', type: 'spelling' as const, reason: 'สะกดคำทับศัพท์ว่า "โควตา" ไม่มีไม้โท' },
    { target: 'คลินิค', replacement: 'คลินิก', type: 'spelling' as const, reason: 'ใช้ ก.ไก่ เป็นตัวสะกด' },
    { target: 'มุขตลก', replacement: 'มุกตลก', type: 'spelling' as const, reason: 'สะกดว่า "มุกตลก" ด้วย ก.ไก่' },

    // ────────────────────────────────────────────────────────
    // หมวดที่ 2: คำฟุ่มเฟือยและคำซ้ำซ้อน (Redundant & Repetitive Words)
    // ────────────────────────────────────────────────────────
    { target: 'แล้วเรียบร้อยแล้ว', replacement: 'แล้ว', type: 'grammar' as const, reason: 'ตัดคำซ้ำซ้อน "เรียบร้อยแล้ว" ออกเมื่อมีคำว่า "แล้ว"' },
    { target: 'ได้ทำการส่ง', replacement: 'ส่ง', type: 'grammar' as const, reason: 'ตัดกริยาซ้อนและกริยาช่วย "ได้ทำการ" ออก ให้เหลือเพียง "ส่ง"' },
    { target: 'ทำการส่ง', replacement: 'ส่ง', type: 'grammar' as const, reason: 'ตัดกริยาช่วย "ทำการ" ออกเพื่อความกระชับ' },
    { target: 'ทำการวิเคราะห์', replacement: 'วิเคราะห์', type: 'grammar' as const, reason: 'ใช้คำกริยา "วิเคราะห์" ได้โดยตรง' },
    { target: 'ทำการศึกษา', replacement: 'ศึกษา', type: 'grammar' as const, reason: 'ใช้คำกริยา "ศึกษา" ได้โดยตรง' },
    { target: 'ทำการทดลอง', replacement: 'ทดลอง', type: 'grammar' as const, reason: 'ใช้คำกริยา "ทดลอง" ได้โดยตรง' },
    { target: 'ทำการตรวจสอบ', replacement: 'ตรวจสอบ', type: 'grammar' as const, reason: 'ใช้คำกริยา "ตรวจสอบ" ได้โดยตรง' },
    { target: 'ได้ทำการ', replacement: 'ได้', type: 'grammar' as const, reason: 'ตัดคำว่า "ทำการ" ออก' },
    { target: 'มีความต้องการที่จะ', replacement: 'ต้องการ', type: 'wordUsage' as const, reason: 'รวบคำเป็น "ต้องการ" เพื่อลดความเยิ่นเย้อ' },
    { target: 'มีความประสงค์ที่จะ', replacement: 'ประสงค์', type: 'wordUsage' as const, reason: 'รวบคำเป็น "ประสงค์" เพื่อลดคำฟุ่มเฟือย' },
    { target: 'มีจุดประสงค์เพื่อที่จะ', replacement: 'มีวัตถุประสงค์เพื่อ', type: 'wordUsage' as const, reason: 'ใช้คำศัพท์เชิงวิชาการและลดคำฟุ่มเฟือย' },
    { target: 'มีความจำเป็นที่จะต้อง', replacement: 'จำเป็นต้อง', type: 'wordUsage' as const, reason: 'รวบเป็น "จำเป็นต้อง" เพื่อประโยคที่กระชับ' },
    { target: 'เป็นจำนวนทั้งสิ้น', replacement: 'รวม', type: 'wordUsage' as const, reason: 'ใช้คำกระชับ "รวม"' },
    { target: 'ในอนาคตข้างหน้า', replacement: 'ในอนาคต', type: 'wordUsage' as const, reason: 'คำว่า "อนาคต" หมายถึงข้างหน้าอยู่แล้ว ตัดคำซ้ำซ้อน' },

    // ────────────────────────────────────────────────────────
    // หมวดที่ 3: ระดับภาษาไม่เหมาะสม (Inappropriate Academic Tone)
    // ────────────────────────────────────────────────────────
    { target: 'เยอะแยะ', replacement: 'จำนวนมาก', type: 'academic' as const, reason: 'หลีกเลี่ยงภาษาพูด ปรับเป็นภาษาทางการ "จำนวนมาก"' },
    { target: 'เยอะมาก', replacement: 'จำนวนมาก', type: 'academic' as const, reason: 'หลีกเลี่ยงภาษาพูด ปรับเป็นภาษาทางการ "จำนวนมาก"' },
    { target: 'จริงๆ แล้ว', replacement: 'แท้จริงแล้ว', type: 'academic' as const, reason: 'ปรับภาษาพูดเป็นภาษาทางการ' },
    { target: 'จริงๆ', replacement: 'แท้จริง', type: 'academic' as const, reason: 'ปรับภาษาพูดเป็นภาษาทางการ' },
    { target: 'ในส่วนของ', replacement: 'สำหรับ', type: 'academic' as const, reason: 'ใช้คำเชื่อมที่กระชับและเป็นทางการขึ้น' },
    { target: 'แบบว่า', replacement: '', type: 'academic' as const, reason: 'ตัดคำภาษาพูดที่ไม่จำเป็นออก' },
    { target: 'ก็คือ', replacement: 'คือ', type: 'academic' as const, reason: 'ตัดคำเน้นเสียงภาษาพูด "ก็"' },
    { target: 'ทำเรื่อง', replacement: 'ยื่นคำร้อง', type: 'academic' as const, reason: 'ใช้ภาษาวิชาการ/ราชการที่เป็นทางการ' },
    { target: 'กิน', replacement: 'รับประทาน', type: 'academic' as const, reason: 'ปรับภาษาปากเป็นภาษาสุภาพ' },
    { target: 'ทาน', replacement: 'รับประทาน', type: 'academic' as const, reason: 'ปรับภาษาปากเป็นภาษาสุภาพวิชาการ' },
    { target: 'นิดหน่อย', replacement: 'เล็กน้อย', type: 'academic' as const, reason: 'ใช้คำทางการ "เล็กน้อย"' },
    { target: 'ตัวอย่างเช่น', replacement: 'เช่น', type: 'academic' as const, reason: 'ใช้ "เช่น" เพื่อลดความเยิ่นเย้อ' },

    // ────────────────────────────────────────────────────────
    // หมวดที่ 4: โครงสร้างประโยคไม่สมบูรณ์ (Incomplete Sentence Structure)
    // ────────────────────────────────────────────────────────
    { target: 'จึงทำให้เกิด', replacement: 'ส่งผลให้เกิด', type: 'grammar' as const, reason: 'ปรับโครงสร้างประโยคเชื่อมโยงเหตุและผลให้สมบูรณ์' },
    { target: 'ทำให้เกิด', replacement: 'ส่งผลให้เกิด', type: 'grammar' as const, reason: 'ขึ้นต้นประโยคด้วยคำกริยา "ส่งผลให้เกิด" เพื่อความสมบูรณ์ของความหมาย' },
  ];

  let improved = trimmed;
  const detectedHighlights: any[] = [];

  for (const pat of patterns) {
    if (improved.includes(pat.target)) {
      detectedHighlights.push({
        text: pat.target,
        type: pat.type,
        replacement: pat.replacement,
        reason: pat.reason,
      });
      improved = improved.replaceAll(pat.target, pat.replacement);
    }
  }

  const spellingCount = detectedHighlights.filter((h) => h.type === 'spelling').length;
  const grammarCount = detectedHighlights.filter((h) => h.type === 'grammar').length;
  const wordUsageCount = detectedHighlights.filter((h) => h.type === 'wordUsage').length;
  const academicCount = detectedHighlights.filter((h) => h.type === 'academic').length;
  const totalIssues = detectedHighlights.length;

  if (totalIssues === 0) {
    // 0 Issues found - Text is perfect!
    return {
      wordCount: fileName ? 1248 : approxWords,
      sentenceCount: fileName ? 86 : sentenceEstimate,
      issueCount: 0,
      score: 100,
      categories: { spelling: 0, grammar: 0, wordUsage: 0, academic: 0 },
      detectedText: '',
      replacement: '',
      reason: 'ไม่พบคำสะกดผิด คำฟุ่มเฟือย หรือระดับภาษาที่ไม่เหมาะสม ข้อความถูกต้องตามมาตรฐานแล้ว',
      originalText: trimmed,
      improvedText: trimmed,
      detailedBreakdown: {
        spelling: 'ไม่พบคำสะกดผิดในเอกสาร',
        grammar: 'ไม่พบคำฟุ่มเฟือยหรือโครงสร้างประโยคที่ไม่สมบูรณ์',
        wordUsage: 'การใช้คำและคำเชื่อมถูกต้องเหมาะสม',
        academic: 'ระดับภาษาเหมาะสมกับงานเขียนเชิงวิชาการ',
      },
      highlights: [],
    };
  }

  // Have issues
  const primaryIssue = detectedHighlights[0];
  const calculatedScore = Math.max(65, Math.min(96, 100 - totalIssues * 3));

  return {
    wordCount: fileName ? 1248 : approxWords,
    sentenceCount: fileName ? 86 : sentenceEstimate,
    issueCount: totalIssues,
    score: calculatedScore,
    categories: {
      spelling: spellingCount,
      grammar: grammarCount,
      wordUsage: wordUsageCount,
      academic: academicCount,
    },
    detectedText: primaryIssue.text,
    replacement: primaryIssue.replacement,
    reason: primaryIssue.reason,
    originalText: trimmed,
    improvedText: improved !== trimmed ? improved : `${trimmed} (ปรับปรุงให้สอดคล้องกับรูปแบบ${style})`,
    detailedBreakdown: {
      spelling: spellingCount > 0 ? 'พบคำสะกดผิดตามบริบท ควรตรวจสอบตามพจนานุกรมฉบับราชบัณฑิตยสถาน' : 'ไม่พบคำสะกดผิดในเอกสาร',
      grammar: grammarCount > 0 ? `พบคำฟุ่มเฟือย/คำซ้ำซ้อน หรือโครงสร้างประโยคไม่สมบูรณ์ แนะนำให้ตัดออกหรือเติมประธาน` : 'ไม่พบข้อผิดพลาดทางไวยากรณ์',
      wordUsage: wordUsageCount > 0 ? 'ตรวจพบคำเชื่อมหรือสำนวนที่สามารถรวบคำเพื่อลดความเยิ่นเย้อของประโยค' : 'การใช้คำถูกต้องเหมาะสม',
      academic: academicCount > 0 ? `ตรวจพบภาษาพูด/ภาษาปาก ควรปรับระดับภาษาให้มีความเป็นวิชาการ เหมาะสำหรับ${style}` : 'ระดับภาษาเหมาะสมกับงานเขียน',
    },
    highlights: detectedHighlights,
  };
}
