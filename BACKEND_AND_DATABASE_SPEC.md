# Backend & Database Architecture Specification: ThaiWrite AI
## สถาปัตยกรรมระบบหลังบ้านและฐานข้อมูล (Backend & Database Spec)

เอกสารฉบับนี้จัดทำขึ้นเพื่อให้นักพัฒนาฝั่ง **Backend (Python / FastAPI / PyThaiNLP / Node.js)** และ **Database (PostgreSQL / MongoDB / Firebase)** สามารถนำโครงสร้างข้อมูล โมเดลทางภาษา (NLP) และตรรกะการตรวจสอบโครงสร้างเอกสาร (Template Engine) ไปพัฒนาต่อได้อย่างรวดเร็วและถูกต้องตรงตามการทำงานของฝั่ง Frontend

---

## 1. System Overview & Architecture Diagram

```text
               +-------------------------------------------+
               |        Frontend (React + Vite + TS)       |
               +---------------------+---------------------+
                                     |
                          REST API / Multipart Form
                                     |
                                     v
               +-------------------------------------------+
               |         FastAPI / Express API Gateway     |
               |  - Auth & Rate Limiting (Student Tokens)  |
               |  - File Upload Validation (.docx, .pdf)   |
               +----------+----------------------+---------+
                          |                      |
            Text / Tokens |                      | File Buffer / Metadata
                          v                      v
+-------------------------------+  +-------------------------------------+
|        NLP Analysis Core      |  |     Template & Structure Engine     |
| - PyThaiNLP (newmm Tokenizer) |  | - python-docx / PyMuPDF (fitz)      |
| - Hunspell / Thai Dict Check  |  | - Heading Extraction (H1, H2, H3)   |
| - Grammatical Rules Engine    |  | - Page Margins & Font Detector      |
| - Academic Style Rewriter     |  | - Section Order & Hierarchy Matrix  |
+---------------+---------------+  +------------------+------------------+
                |                                     |
                +------------------+------------------+
                                   |
                                   v
             +-----------------------------------------+
             |            Database Layer               |
             | - PostgreSQL (Relational Data / History)|
             | - S3 / GCS / Supabase Storage (Files)   |
             +-----------------------------------------+
```

---

## 2. Database Schema Design (PostgreSQL / Relational)

### 2.1 Entity Relationship (ER) Summary
- `users`: ข้อมูลนักศึกษา/ผู้ใช้งาน
- `document_templates`: แม่แบบมาตรฐานและแม่แบบที่ผู้ใช้อัปโหลด
- `template_sections`: รายการหัวข้อบังคับและลำดับในแต่ละแม่แบบ
- `analysis_jobs`: บันทึกงานตรวจแต่ละครั้ง
- `language_issues`: รายการข้อผิดพลาดทางภาษาและคำแนะนำ
- `structure_results`: ผลการตรวจโครงสร้างและการจัดหน้า

---

### 2.2 SQL DDL (PostgreSQL Schema)

```sql
-- 1. ตารางผู้ใช้งาน / นักศึกษา
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(30) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    faculty VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'University Academic Tier',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางแม่แบบเอกสาร (Templates)
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. TH-THESIS-5CH
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'thesis', 'report', 'research', 'proposal', 'custom'
    description TEXT,
    university VARCHAR(255),
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- กฎการจัดรูปแบบเอกสาร (Formatting Rules JSON)
    formatting_rules JSONB NOT NULL DEFAULT '{
        "fontFamily": "TH Sarabun New",
        "fontSizeHeading": "18pt",
        "fontSizeBody": "16pt",
        "margins": "Left 1.5 inch, Top 1.5/1.0 inch, Right 1.0 inch, Bottom 1.0 inch",
        "lineSpacing": "1.0",
        "pageNumbering": "Top Right"
    }'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตารางหัวข้อที่ต้องมีในแม่แบบ (Template Required Sections)
CREATE TABLE template_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,        -- e.g. "บทที่ 1 บทนำ", "1.1 ความเป็นมา"
    section_level INT NOT NULL DEFAULT 1, -- 1: บท, 2: หัวข้อหลัก, 3: หัวข้อย่อย
    expected_order INT NOT NULL,        -- ลำดับที่คาดหวัง 1, 2, 3...
    is_required BOOLEAN DEFAULT TRUE,
    description TEXT
);

-- 4. ตารางบันทึกการตรวจสอบ (Analysis Jobs)
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    template_id UUID REFERENCES document_templates(id),
    document_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- 'docx', 'pdf', 'text'
    file_url TEXT,         -- Object Storage URL (S3 / Cloud Storage)
    file_size_bytes BIGINT,
    writing_style VARCHAR(50) NOT NULL, -- 'ทั่วไป', 'เชิงวิชาการ', 'รายงาน', 'บทความ', 'วิทยานิพนธ์'
    
    -- คะแนนภาพรวม
    language_score INT NOT NULL,   -- e.g. 87/100
    structure_score INT NOT NULL,  -- e.g. 90/100
    overall_status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
    
    -- ตัวเลขสถิติทางภาษา
    word_count INT DEFAULT 0,
    sentence_count INT DEFAULT 0,
    issue_count INT DEFAULT 0,
    
    -- เนื้อหาต้นฉบับและฉบับปรับปรุง
    original_text TEXT,
    improved_text TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ตารางข้อผิดพลาดทางภาษา (Language Issues Breakdown)
CREATE TABLE language_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    issue_type VARCHAR(50) NOT NULL, -- 'spelling', 'grammar', 'wordUsage', 'academic'
    detected_text TEXT NOT NULL,     -- คำที่ตรวจพบ เช่น "ทำการส่ง"
    replacement TEXT NOT NULL,       -- คำที่แนะนำ เช่น "ส่ง"
    reason TEXT NOT NULL,            -- คำอธิบายเหตุผล
    start_offset INT,                -- ตำแหน่งตัวอักษรเริ่มต้นในเอกสาร
    end_offset INT,                  -- ตำแหน่งตัวอักษรสิ้นสุด
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ตารางผลการตรวจโครงสร้างเอกสาร (Structure Compliance Details)
CREATE TABLE structure_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    section_title VARCHAR(255) NOT NULL,
    expected_order INT NOT NULL,
    actual_order INT,
    status VARCHAR(50) NOT NULL, -- 'present', 'missing', 'out_of_order', 'warning'
    compliance_note TEXT
);

-- Index เพื่อความรวดเร็วในการ Query ประวัติและการวิเคราะห์
CREATE INDEX idx_analysis_jobs_user ON analysis_jobs(user_id);
CREATE INDEX idx_analysis_jobs_template ON analysis_jobs(template_id);
CREATE INDEX idx_template_sections_tmpl ON template_sections(template_id);
CREATE INDEX idx_language_issues_job ON language_issues(job_id);
CREATE INDEX idx_structure_results_job ON structure_results(job_id);
```

---

## 3. RESTful API Contract (OpenAPI / FastAPI Reference)

Base URL: `/api/v1`

### 3.1 `GET /api/v1/templates`
ดึงรายการแม่แบบมาตรฐานทั้งหมดในระบบ

**Response 200 OK:**
```json
[
  {
    "id": "tmpl-thesis-5ch",
    "name": "แม่แบบวิทยานิพนธ์ / สารนิพนธ์ 5 บท (Graduate Thesis Standard)",
    "code": "TH-THESIS-5CH",
    "category": "thesis",
    "university": "มาตรฐานบัณฑิตวิทยาลัย",
    "requiredSectionsCount": 21,
    "formattingRules": {
      "fontFamily": "TH Sarabun PSK หรือ TH Sarabun New",
      "fontSizeHeading": "18pt ตัวหนา",
      "fontSizeBody": "16pt ตัวปกติ",
      "margins": "ซ้าย 1.5 นิ้ว, บน 1.5/1.0 นิ้ว, ขวา 1.0 นิ้ว, ล่าง 1.0 นิ้ว",
      "lineSpacing": "1.0 เท่า",
      "pageNumbering": "มุมบนขวา"
    }
  }
]
```

---

### 3.2 `POST /api/v1/templates/upload`
อัปโหลดไฟล์แม่แบบเฉพาะของคณะหรือสถาบัน (Custom Template)
- **Content-Type:** `multipart/form-data`
- **Body:** `file: UploadFile` (.docx, .pdf)

**Response 201 Created:**
```json
{
  "id": "tmpl-custom-uuid",
  "name": "แม่แบบวิศวกรรมคอมพิวเตอร์_มจธ",
  "code": "CUSTOM-KMUTT-CPE",
  "category": "custom",
  "isCustom": true,
  "detectedSections": [
    { "title": "บทที่ 1 บทนำ", "level": 1, "required": true },
    { "title": "1.1 ความเป็นมาและความสำคัญ", "level": 2, "required": true }
  ]
}
```

---

### 3.3 `POST /api/v1/analyze` (Main Analysis Endpoint)
ตรวจวิเคราะห์ทั้งภาษา (NLP) และโครงสร้างไฟล์ (Structure & Format)
- **Content-Type:** `multipart/form-data` หรือ `application/json`

**Form Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `template_id` | string | Yes | รหัสแม่แบบที่ใช้เทียบ |
| `writing_style` | string | Yes | 'ทั่วไป', 'เชิงวิชาการ', 'รายงาน', 'บทความ', 'วิทยานิพนธ์' |
| `input_mode` | string | Yes | 'text' หรือ 'file' |
| `text` | string | Optional | ข้อความเนื้อหา (กรณี input_mode='text') |
| `file` | file | Optional | ไฟล์ .docx, .pdf (กรณี input_mode='file') |

**Response 200 OK (Matches Frontend `AnalysisResult` & `StructureResult`):**
```json
{
  "jobId": "job-8f9213ab-e8b9",
  "documentName": "รายงานเรื่อง เทคโนโลยีปัญญาประดิษฐ์.docx",
  
  "languageResult": {
    "wordCount": 1248,
    "sentenceCount": 86,
    "issueCount": 5,
    "score": 87,
    "categories": {
      "spelling": 1,
      "grammar": 2,
      "wordUsage": 1,
      "academic": 1
    },
    "detectedText": "ทำการส่ง",
    "replacement": "ส่ง",
    "reason": "คำว่า 'ทำการส่ง' สามารถใช้คำว่า 'ส่ง' ได้โดยตรง ทำให้ประโยคกระชับและเหมาะกับงานเขียนเชิงวิชาการ",
    "originalText": "นักศึกษามีความต้องการที่จะทำการส่งรายงานภายในวันพรุ่งนี้",
    "improvedText": "นักศึกษาต้องการส่งรายงานภายในวันพรุ่งนี้",
    "detailedBreakdown": {
      "spelling": "พบคำสะกดผิดที่อาจพิมพ์ตกหล่น เช่น 'สัมนา' ปรับเป็น 'สัมมนา'",
      "grammar": "มีการใช้กริยาฟุ่มเฟือย 'ทำการส่ง' แนะนำให้ตัด 'ทำการ' ออก",
      "wordUsage": "รวบคำว่า 'มีความต้องการที่จะ' เป็น 'ต้องการ'",
      "academic": "ควรหลีกเลี่ยงภาษาพูด เช่น 'เยอะแยะ' เปลี่ยนเป็น 'จำนวนมาก'"
    }
  },

  "structureResult": {
    "templateName": "แม่แบบวิทยานิพนธ์ / สารนิพนธ์ 5 บท (Graduate Thesis Standard)",
    "templateId": "tmpl-thesis-5ch",
    "overallScore": 90,
    "complianceStatus": "pass",
    "sectionsSummary": {
      "total": 21,
      "matched": 19,
      "missing": 1,
      "outOfOrder": 1
    },
    "sectionChecks": [
      {
        "id": "s1",
        "title": "บทที่ 1 บทนำ",
        "level": 1,
        "status": "present",
        "expectedPosition": 1,
        "actualPosition": 1,
        "note": "พบหัวข้อครบถ้วนตามโครงสร้างแม่แบบ"
      },
      {
        "id": "s1-4",
        "title": "1.4 นิยามศัพท์เฉพาะ",
        "level": 2,
        "status": "missing",
        "expectedPosition": 4,
        "note": "ไม่พบหัวข้อนี้ในเอกสาร"
      }
    ],
    "formattingChecks": [
      {
        "id": "fmt-font",
        "ruleName": "แบบอักษรและขนาด (Font & Size)",
        "expected": "TH Sarabun New, 16pt",
        "detected": "TH Sarabun New, 16pt (ตรงตามเกณฑ์)",
        "status": "pass",
        "recommendation": "แบบอักษรถูกต้องตรงตามระเบียบบัณฑิตวิทยาลัย"
      }
    ],
    "structureRecommendations": [
      "เพิ่มหัวข้อบังคับที่ยังขาดหายไปเพื่อให้ครบตามเกณฑ์แม่แบบ",
      "ตรวจสอบหน้าแรกของแต่ละบท ให้เว้นการแสดงเลขหน้า"
    ]
  }
}
```

---

## 4. Backend Implementation Guide (Python / FastAPI)

### 4.1 Recommended Python Libraries
- **NLP & Thai Text:** `pythainlp` (ใช้ engine `newmm`), `attacut`
- **Spell Checking:** `pythainlp.spell.correct`, `pythainlp.corpus.thai_words`
- **DOCX Parsing & Format Extractor:** `python-docx`
  - ตรวจสอบ `paragraph.runs[0].font.name` (ฟอนต์)
  - ตรวจสอบ `section.left_margin`, `section.top_margin` (ระยะขอบ)
  - ตรวจสอบ `paragraph.style.name` (Heading 1, Heading 2)
- **PDF Parsing:** `PyMuPDF` (`fitz`) หรือ `pdfplumber`

### 4.2 Python Structure Extraction Sample (`docx_parser.py`)

```python
import docx

def parse_docx_structure(file_path: str):
    doc = docx.Document(file_path)
    sections = []
    
    # 1. ตรวจสอบระยะขอบ (Margins)
    section_fmt = doc.sections[0]
    left_margin_inches = round(section_fmt.left_margin.inches, 2)
    top_margin_inches = round(section_fmt.top_margin.inches, 2)
    
    # 2. สแกนหัวข้อ (Headings)
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue
        
        # ตรวจสอบว่าเป็น Heading หรือ บทที่
        if p.style.name.startswith('Heading') or text.startswith(('บทที่', '1.', '2.', '3.')):
            sections.append({
                "title": text,
                "style": p.style.name,
                "fontSize": p.runs[0].font.size.pt if p.runs and p.runs[0].font.size else 16,
                "isBold": p.runs[0].font.bold if p.runs else False
            })
            
    return {
        "margins": {"left": left_margin_inches, "top": top_margin_inches},
        "detectedHeadings": sections
    }
```

### 4.3 Python Thai NLP Grammar & Word Replacement Sample (`nlp_engine.py`)

```python
import re
from pythainlp.tokenize import word_tokenize
from pythainlp.spell import correct

ACADEMIC_REPLACEMENTS = [
    (r"ทำการส่ง", "ส่ง", "grammar", "ตัดกริยาช่วยฟุ่มเฟือย 'ทำการ' ออก"),
    (r"มีความต้องการที่จะ", "ต้องการ", "wordUsage", "รวบคำเพื่อลดความเยิ่นเย้อของประโยค"),
    (r"เยอะแยะ", "จำนวนมาก", "academic", "หลีกเลี่ยงภาษาพูด เปลี่ยนเป็นภาษาทางการ"),
    (r"ทำการวิเคราะห์", "วิเคราะห์", "grammar", "ใช้คำกริยาตรงเพื่อความกระชับ"),
    (r"สัมนา", "สัมมนา", "spelling", "สะกดถูกต้องตามพจนานุกรมราชบัณฑิตยสถาน"),
]

def analyze_thai_text(text: str):
    words = word_tokenize(text, engine="newmm")
    improved_text = text
    issues = []
    
    for pattern, repl, issue_type, reason in ACADEMIC_REPLACEMENTS:
        if re.search(pattern, improved_text):
            issues.append({
                "type": issue_type,
                "target": pattern,
                "replacement": repl,
                "reason": reason
            })
            improved_text = re.sub(pattern, repl, improved_text)
            
    return {
        "wordCount": len(words),
        "issues": issues,
        "improvedText": improved_text
    }
```

---

## 5. Security, Storage & Production Considerations
1. **File Storage:** ใช้ S3-compatible Object Storage (เช่น AWS S3, Cloud Storage, MinIO) จัดเก็บเอกสารที่ส่งตรวจและไฟล์ Template
2. **File Cleanup Policy:** สำหรับความเป็นส่วนตัวของนักศึกษา กำหนด TTL (Time-To-Live) ลบไฟล์ต้นฉบับออกจากเซิร์ฟเวอร์ภายใน 7 วันหลังประมวลผลเสร็จ หรือเก็บเฉพาะข้อความ Metadata
3. **Async Queue:** งานตรวจไฟล์เอกสารขนาดใหญ่ (เช่น วิทยานิพนธ์ 100+ หน้า) ควรใช้ Background Worker เช่น **Celery + Redis** หรือ **BullMQ** เพื่อไม่ให้ HTTP Request ค้างนานเกินไป
4. **Environment Variables:**
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/thaiwrite_db
   REDIS_URL=redis://localhost:6379/0
   STORAGE_BUCKET_NAME=thaiwrite-docs
   MAX_UPLOAD_SIZE_MB=10
   ```

---

## 6. Frontend Ingestion & Fullscreen Workstation Architecture (อัปเดตล่าสุด)

### 6.1 Real Data Ingestion Pipeline (การดึงข้อมูลจริงที่ผู้ใช้ป้อน/อัปโหลด)
- **Text Extraction Engine (`src/utils/fileExtractor.ts`):**
  - **`.docx` Documents:** ถอดรหัสโครงสร้าง XML ภายในไฟล์ Word ผ่าน `mammoth.extractRawText` ดึงข้อความภาษาไทยจริงโดยไม่ต้องผ่านเซิร์ฟเวอร์
  - **`.txt` Plaintext:** อ่าน Stream ข้อความ UTF-8 ด้วย Native `File.text()`
  - **`.pdf` Files:** ใช้ `pdfjs-dist` (Mozilla PDF.js) สกัดข้อความจริงทีละหน้ากระดาษ พร้อมระบบกรองคำสั่งไบนารี (`%PDF-`, `obj`, `Type`) เพื่อความถูกต้องแม่นยำสูงสุด
- **Dynamic A4 Multi-page Chunking (`src/data/mockDocumentPreview.ts`):**
  - นำข้อความจริงของผู้ใช้มาตัดย่อหน้าและจัดลงหน้ากระดาษ A4 เสมือนจริง (2-3 ย่อหน้า หรือ ~1,200-1,800 ตัวอักษรต่อหน้า)
  - สแกนกฎไวยากรณ์ คำสะกดผิด และสำนวนวิชาการบนข้อความจริงของผู้ใช้
  - กำกับหมายเลข `[1]`, `[2]`, `[3]` ... บนคำผิดในแต่ละหน้าอย่างแม่นยำ

### 6.2 Fullscreen Workspace with Hover-Activated Transparent Overlays (หน้าจอเต็มและแถบโปร่งแสง)
- **True Fullscreen Viewport (`100vw × 100vh`):**
  - สลับเข้าสู่โหมดเต็มจออัตโนมัติเมื่อกดตรวจเอกสาร โดยซ่อน Header/Footer หลัก เพื่อให้กระดาษ A4 ได้พื้นที่แสดงผลสูงสุด
- **Glassmorphic Floating Overlays:**
  - แถบควบคุมด้านบนและแถบดาวน์โหลดด้านล่างลอยอยู่เหนือเอกสาร (Floating Overlays)
  - มีความโปร่งใส `opacity: 40%` พร้อม `backdrop-blur-md` ในขณะอ่านปกติ เพื่อให้เห็นตัวหนังสือใต้แถบ
  - เมื่อผู้ใช้นำเมาส์เลื่อนเข้ามาใกล้ แถบจะสว่างขึ้นเป็น `opacity: 100%` อัตโนมัติ (Hover Reveal)
- **Dropdown Page Selector & Navigation (การเลือกหน้าแบบดรอปดาวน์):**
  - รวมรายการหน้าทั้งหมดไว้ใน Dropdown เมนู แก้ปัญหาปุ่มล้นขอบจอเมื่อเอกสารมีหลายสิบหน้า
  - มีปุ่มลัด `[◀ ก่อนหน้า]` และ `[ถัดไป ▶]` สำหรับคลิกเปลี่ยนหน้าทีละหน้าอย่างคล่องตัว
  - รองรับการเทียบ 2 ฝั่ง (Split Screen: ต้นฉบับ vs ฉบับตรวจแก้) พร้อมกันอย่างแม่นยำ
