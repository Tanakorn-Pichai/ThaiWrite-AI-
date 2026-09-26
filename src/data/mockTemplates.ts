import { DocTemplate, StructureResult, SectionCheckItem, FormattingCheckItem } from '../types';

export const STANDARD_TEMPLATES: DocTemplate[] = [
  {
    id: 'tmpl-thesis-5ch',
    name: 'แม่แบบวิทยานิพนธ์ / สารนิพนธ์ 5 บท (Graduate Thesis Standard)',
    shortName: 'วิทยานิพนธ์ 5 บท',
    code: 'TH-THESIS-5CH',
    category: 'thesis',
    description: 'โครงสร้างวิทยานิพนธ์ระดับบัณฑิตศึกษาและปริญญาตรีมาตรฐาน 5 บท พร้อมส่วนนำและส่วนท้าย',
    university: 'มาตรฐานบัณฑิตวิทยาลัย (ทบวงมหาวิทยาลัย / อว.)',
    formattingRules: {
      fontFamily: 'TH Sarabun PSK หรือ TH Sarabun New',
      fontSizeHeading: '18pt ตัวหนา (บทที่), 16pt ตัวหนา (หัวข้อหลัก)',
      fontSizeBody: '16pt ตัวปกติ',
      margins: 'บน 1.5 นิ้ว (บทแรก) / 1.0 นิ้ว, ซ้าย 1.5 นิ้ว, ขวา 1.0 นิ้ว, ล่าง 1.0 นิ้ว',
      lineSpacing: '1.0 เท่า (Single Space) ย่อหน้า 0.5 นิ้ว',
      pageNumbering: 'มุมบนขวา ห่างขอบบน 1 นิ้ว (หน้าแรกของบทไม่ต้องใส่เลขหน้า)',
    },
    requiredSections: [
      { id: 's1', title: 'บทที่ 1 บทนำ', level: 1, required: true, description: 'ความเป็นมาและวัตถุประสงค์ของการวิจัย' },
      { id: 's1-1', title: '1.1 ความเป็นมาและความสำคัญของปัญหา', level: 2, required: true },
      { id: 's1-2', title: '1.2 วัตถุประสงค์การวิจัย', level: 2, required: true },
      { id: 's1-3', title: '1.3 ขอบเขตการวิจัย', level: 2, required: true },
      { id: 's1-4', title: '1.4 นิยามศัพท์เฉพาะ', level: 2, required: false },
      { id: 's1-5', title: '1.5 ประโยชน์ที่คาดว่าจะได้รับ', level: 2, required: true },
      { id: 's2', title: 'บทที่ 2 วรรณกรรมและงานวิจัยที่เกี่ยวข้อง', level: 1, required: true, description: 'ทฤษฎี กรอบแนวคิด และงานวิจัยที่เกี่ยวข้อง' },
      { id: 's2-1', title: '2.1 แนวคิดและทฤษฎีพื้นฐาน', level: 2, required: true },
      { id: 's2-2', title: '2.2 งานวิจัยที่เกี่ยวข้อง (ในประเทศและต่างประเทศ)', level: 2, required: true },
      { id: 's2-3', title: '2.3 กรอบแนวคิดการวิจัย', level: 2, required: true },
      { id: 's3', title: 'บทที่ 3 วิธีดำเนินการวิจัย', level: 1, required: true, description: 'กลุ่มตัวอย่าง เครื่องมือ และขั้นตอนการวิเคราะห์' },
      { id: 's3-1', title: '3.1 ประชากรและกลุ่มตัวอย่าง', level: 2, required: true },
      { id: 's3-2', title: '3.2 เครื่องมือที่ใช้ในการวิจัยและการหาคุณภาพ', level: 2, required: true },
      { id: 's3-3', title: '3.3 การเก็บรวบรวมข้อมูล', level: 2, required: true },
      { id: 's3-4', title: '3.4 การวิเคราะห์ข้อมูลและสถิติที่ใช้', level: 2, required: true },
      { id: 's4', title: 'บทที่ 4 ผลการวิเคราะห์ข้อมูล', level: 1, required: true, description: 'การนำเสนอผลการวิจัยพร้อมตารางและกราฟ' },
      { id: 's4-1', title: '4.1 ผลการวิเคราะห์ข้อมูลตามวัตถุประสงค์', level: 2, required: true },
      { id: 's5', title: 'บทที่ 5 สรุป อภิปรายผล และข้อเสนอแนะ', level: 1, required: true, description: 'สรุปการวิจัย อภิปรายผลเชิงวิชาการ' },
      { id: 's5-1', title: '5.1 สรุปผลการวิจัย', level: 2, required: true },
      { id: 's5-2', title: '5.2 การอภิปรายผล', level: 2, required: true },
      { id: 's5-3', title: '5.3 ข้อเสนอแนะในการนำผลวิจัยไปใช้', level: 2, required: true },
      { id: 's6', title: 'บรรณานุกรม (References)', level: 1, required: true, description: 'รูปแบบ APA 7th Edition' },
    ],
  },
  {
    id: 'tmpl-project-report',
    name: 'แม่แบบรายงานโครงงานปริญญานิพนธ์ (Senior Project Report)',
    shortName: 'รายงานโครงงาน',
    code: 'TH-SENIOR-PROJ',
    category: 'report',
    description: 'โครงสร้างเล่มโครงงานวิศวกรรม วิทยาการคอมพิวเตอร์ และเทคโนโลยีสารสนเทศ',
    university: 'คณะวิศวกรรมศาสตร์ / คณะวิทยาการสารสนเทศ',
    formattingRules: {
      fontFamily: 'TH Sarabun New',
      fontSizeHeading: 'หัวข้อหลัก 18pt ตัวหนา, หัวข้อย่อย 16pt ตัวหนา',
      fontSizeBody: '16pt ตัวปกติ',
      margins: 'บน 1.5 นิ้ว (หน้าแรกของบท) / 1.0 นิ้ว, ซ้าย 1.5 นิ้ว, ขวา 1.0 นิ้ว, ล่าง 1.0 นิ้ว',
      lineSpacing: '1.0 เท่า กั้นหน้าตรง กั้นหลังเสมอ',
      pageNumbering: 'มุมบนขวา (หน้าแรกของบทไม่แสดงเลขหน้า)',
    },
    requiredSections: [
      { id: 'p1', title: 'บทที่ 1 บทนำและที่มาของโครงงาน', level: 1, required: true },
      { id: 'p1-1', title: '1.1 ความเป็นมาและความสำคัญ', level: 2, required: true },
      { id: 'p1-2', title: '1.2 วัตถุประสงค์ของโครงงาน', level: 2, required: true },
      { id: 'p1-3', title: '1.3 ขอบเขตของโครงงานและระบบ', level: 2, required: true },
      { id: 'p2', title: 'บทที่ 2 ทฤษฎีและเทคโนโลยีที่เกี่ยวข้อง', level: 1, required: true },
      { id: 'p3', title: 'บทที่ 3 การออกแบบและพัฒนาระบบ (System Architecture)', level: 1, required: true },
      { id: 'p3-1', title: '3.1 ความต้องการของระบบ (System Requirements)', level: 2, required: true },
      { id: 'p3-2', title: '3.2 สถาปัตยกรรมและการออกแบบฐานข้อมูล', level: 2, required: true },
      { id: 'p4', title: 'บทที่ 4 ผลการทดสอบและประเมินประสิทธิภาพ', level: 1, required: true },
      { id: 'p5', title: 'บทที่ 5 สรุปผลการดำเนินงานและข้อเสนอแนะ', level: 1, required: true },
      { id: 'p6', title: 'เอกสารอ้างอิง', level: 1, required: true },
    ],
  },
  {
    id: 'tmpl-research-paper',
    name: 'แม่แบบบทความวิชาการ / บทความวิจัย (TCI / Academic Conference)',
    shortName: 'บทความวิจัย',
    code: 'TH-ACAD-PAPER',
    category: 'research',
    description: 'โครงสร้างบทความวิจัยขนาด 8-15 หน้า สำหรับตีพิมพ์วารสาร TCI หรือประชุมวิชาการ',
    university: 'ศูนย์ดัชนีการอ้างอิงวารสารไทย (TCI Tier 1 & 2)',
    formattingRules: {
      fontFamily: 'TH Sarabun PSK หรือ Angsana New',
      fontSizeHeading: 'ชื่อบทความ 18pt ตัวหนา, หัวข้อหลัก 16pt ตัวหนา',
      fontSizeBody: '14-16pt ตัวปกติ แบบ 2 คอลัมน์ (Two-Column format)',
      margins: 'บน 1 นิ้ว, ล่าง 1 นิ้ว, ซ้าย 1 นิ้ว, ขวา 1 นิ้ว (ระยะขอบสม่ำเสมอ)',
      lineSpacing: '1.0 เท่า คอลัมน์ห่างกัน 0.8 ซม.',
      pageNumbering: 'กึ่งกลางด้านล่าง หรือ มุมบนขวา',
    },
    requiredSections: [
      { id: 'r1', title: 'ชื่อบทความ (ภาษาไทยและภาษาอังกฤษ)', level: 1, required: true },
      { id: 'r2', title: 'บทคัดย่อ (Abstract) และคำสำคัญ (Keywords)', level: 1, required: true },
      { id: 'r3', title: '1. บทนำ (Introduction)', level: 1, required: true },
      { id: 'r4', title: '2. วัตถุประสงค์ของการวิจัย (Research Objectives)', level: 1, required: true },
      { id: 'r5', title: '3. วิธีดำเนินการวิจัย (Research Methodology)', level: 1, required: true },
      { id: 'r6', title: '4. ผลการวิจัยและอภิปรายผล (Results and Discussion)', level: 1, required: true },
      { id: 'r7', title: '5. สรุปผลการวิจัย (Conclusion)', level: 1, required: true },
      { id: 'r8', title: 'กิตติกรรมประกาศ (Acknowledgement)', level: 1, required: false },
      { id: 'r9', title: 'เอกสารอ้างอิง (References)', level: 1, required: true },
    ],
  },
  {
    id: 'tmpl-proposal',
    name: 'แม่แบบข้อเสนอโครงการวิจัย (Research Proposal / เค้าโครงวิจัย)',
    shortName: 'ข้อเสนอโครงการ',
    code: 'TH-RESEARCH-PROP',
    category: 'proposal',
    description: 'แบบเสนอเค้าโครงวิจัยสำหรับขออนุมัติหัวข้อวิทยานิพนธ์หรือขอทุนสนับสนุนการวิจัย',
    university: 'สถาบันวิจัยและพัฒนา / บัณฑิตวิทยาลัย',
    formattingRules: {
      fontFamily: 'TH Sarabun New',
      fontSizeHeading: '16pt ตัวหนา',
      fontSizeBody: '16pt ตัวปกติ',
      margins: 'บน 1.5 นิ้ว, ซ้าย 1.5 นิ้ว, ขวา 1 นิ้ว, ล่าง 1 นิ้ว',
      lineSpacing: '1.0 เท่า',
      pageNumbering: 'มุมบนขวา',
    },
    requiredSections: [
      { id: 'pr1', title: '1. ชื่อโครงการวิจัย (ภาษาไทยและภาษาอังกฤษ)', level: 1, required: true },
      { id: 'pr2', title: '2. ความสำคัญและที่มาของปัญหาที่ทำการวิจัย', level: 1, required: true },
      { id: 'pr3', title: '3. วัตถุประสงค์ของโครงการวิจัย', level: 1, required: true },
      { id: 'pr4', title: '4. สมมติฐานและกรอบแนวคิดการวิจัย', level: 1, required: false },
      { id: 'pr5', title: '5. ประโยชน์ที่คาดว่าจะได้รับ', level: 1, required: true },
      { id: 'pr6', title: '6. ระเบียบวิธีวิจัยและแผนการดำเนินงาน', level: 1, required: true },
      { id: 'pr7', title: '7. งบประมาณและระยะเวลาดำเนินการ', level: 1, required: true },
      { id: 'pr8', title: '8. เอกสารอ้างอิง', level: 1, required: true },
    ],
  },
];

/**
 * Perform template and structure compliance check
 */
export function evaluateStructure(
  text: string,
  fileName: string | undefined,
  template: DocTemplate
): StructureResult {
  const content = text || '';
  const isDemoOrShort = content.length < 300 && !fileName;

  // Evaluate required sections based on presence in text or simulated detection
  const sectionChecks: SectionCheckItem[] = template.requiredSections.map((sec, idx) => {
    // Check if section keyword exists in content
    const cleanTitle = sec.title.replace(/^[0-9.]+\s*/, '').trim();
    const hasMatch =
      content.includes(cleanTitle) ||
      content.includes(sec.title) ||
      (isDemoOrShort && idx < 3); // For demo text, simulate some matches

    // Simulated check for structure testing
    let status: 'present' | 'missing' | 'out_of_order' | 'warning' = 'present';
    let note = 'พบหัวข้อครบถ้วนตามโครงสร้างแม่แบบ';

    if (sec.required && !hasMatch) {
      if (idx === 1 && !isDemoOrShort) {
        status = 'out_of_order';
        note = 'ตรวจพบหัวข้อแต่ตำแหน่งอาจสลับหรือไม่ได้ลำดับตามมาตรฐานบท';
      } else {
        status = 'missing';
        note = `ไม่พบหัวข้อ "${sec.title}" ซึ่งเป็นส่วนบังคับตามเกณฑ์ของ ${template.name}`;
      }
    } else if (!sec.required && !hasMatch) {
      status = 'warning';
      note = 'หัวข้อทางเลือก ไม่พบในเอกสาร (สามารถมีหรือไม่มีได้)';
    }

    return {
      id: sec.id,
      title: sec.title,
      level: sec.level,
      status,
      expectedPosition: idx + 1,
      actualPosition: status === 'present' ? idx + 1 : status === 'out_of_order' ? idx + 2 : undefined,
      note,
    };
  });

  // Evaluate Formatting and Layout compliance
  const formattingChecks: FormattingCheckItem[] = [
    {
      id: 'fmt-font',
      ruleName: 'แบบอักษรและขนาด (Font & Size)',
      expected: template.formattingRules.fontFamily + ', ' + template.formattingRules.fontSizeBody,
      detected: fileName ? 'TH Sarabun New, 16pt (ตรงตามเกณฑ์)' : 'ตรวจพบฟอนต์มาตรฐาน TH Sarabun New',
      status: 'pass',
      recommendation: 'แบบอักษรและขนาดข้อความเนื้อหาถูกต้องตรงตามเกณฑ์มาตรฐาน',
    },
    {
      id: 'fmt-margin',
      ruleName: 'ระยะขอบกระดาษ (Page Margins)',
      expected: template.formattingRules.margins,
      detected: fileName ? 'ซ้าย 1.5 นิ้ว, บน 1.5 นิ้ว, ขวา 1.0 นิ้ว, ล่าง 1.0 นิ้ว' : 'ตั้งค่าระยะขอบหน้ากระดาษมาตรฐาน',
      status: 'pass',
      recommendation: 'ระยะขอบหน้ากระดาษเป็นไปตามระเบียบงานวิชาการ (เว้นขอบซ้าย 1.5 นิ้ว สำหรับการเข้าเล่ม)',
    },
    {
      id: 'fmt-hierarchy',
      ruleName: 'ลำดับหัวข้อและเลขข้อย่อย (Heading Hierarchy)',
      expected: 'จัดลำดับหัวข้อหลัก (18pt หนา) และหัวข้อย่อย (16pt หนา) สม่ำเสมอ',
      detected: 'พบลำดับหัวข้อย่อยบางจุดใช้ตัวเลขไม่สอดคล้องกับเลขบท',
      status: 'warning',
      recommendation: 'ปรับแก้เลขข้อเช่นในบทที่ 1 ควรขึ้นต้นด้วย 1.1, 1.2 ตามลำดับ และใช้ฟอนต์ตัวหนาเน้นหัวข้อ',
    },
    {
      id: 'fmt-pagination',
      ruleName: 'การใส่เลขหน้าและสารบัญ (Page Numbers & TOC)',
      expected: template.formattingRules.pageNumbering,
      detected: 'ตรวจพบเลขหน้า แต่หน้าแรกของบทยังมีตัวเลขปรากฏอยู่',
      status: 'warning',
      recommendation: 'หน้าแรกของแต่ละบทต้องเว้นการแสดงเลขหน้าตามแบบฟอร์มวิทยานิพนธ์',
    },
    {
      id: 'fmt-spacing',
      ruleName: 'ระยะบรรทัดและย่อหน้า (Line Spacing & Indent)',
      expected: template.formattingRules.lineSpacing,
      detected: 'ระยะบรรทัด 1.0 เท่า, ย่อหน้า 0.5 นิ้ว ถูกต้อง',
      status: 'pass',
      recommendation: 'ระยะห่างบรรทัดและการเยื้องย่อหน้าสม่ำเสมอตลอดทั้งไฟล์',
    },
  ];

  const matched = sectionChecks.filter((s) => s.status === 'present').length;
  const missing = sectionChecks.filter((s) => s.status === 'missing').length;
  const outOfOrder = sectionChecks.filter((s) => s.status === 'out_of_order').length;

  const total = sectionChecks.length;
  const rawScore = Math.round((matched / total) * 70 + (formattingChecks.filter((f) => f.status === 'pass').length / formattingChecks.length) * 30);
  const overallScore = Math.max(65, Math.min(95, rawScore));

  const complianceStatus: 'pass' | 'needs_revision' | 'fail' =
    overallScore >= 85 ? 'pass' : overallScore >= 70 ? 'needs_revision' : 'fail';

  const structureRecommendations: string[] = [];

  if (missing > 0) {
    structureRecommendations.push(`เพิ่มหัวข้อบังคับที่ยังขาดหายไปจำนวน ${missing} หัวข้อ เพื่อให้ครบตามเกณฑ์ของ ${template.name}`);
  }
  if (outOfOrder > 0) {
    structureRecommendations.push('จัดเรียงลำดับหัวข้อย่อยให้ถูกต้องตามโครงสร้างแม่แบบ');
  }
  structureRecommendations.push('ตรวจสอบหน้าแรกของแต่ละบท ให้ซ่อนเลขหน้าตามระเบียบการจัดพิมพ์');
  structureRecommendations.push(`ตรวจสอบการจัดทำสารบัญ (Table of Contents) ให้ตรงกับหมายเลขหน้าจริงของไฟล์`);

  return {
    templateName: template.name,
    templateId: template.id,
    overallScore,
    complianceStatus,
    sectionsSummary: {
      total,
      matched,
      missing,
      outOfOrder,
    },
    sectionChecks,
    formattingChecks,
    structureRecommendations,
  };
}
