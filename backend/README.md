# ThaiWrite AI - Backend Service

ระบบหลังบ้านสำหรับบริการตรวจทานและวิเคราะห์ภาษาไทยเชิงวิชาการตามข้อกำหนดใน `BACKEND_AND_DATABASE_SPEC.md`

## เทคโนโลยีหลัก (Tech Stack)
- **Framework:** FastAPI (Python 3.11)
- **NLP Engine:** PyThaiNLP (ใช้ engine `newmm` สำหรับตัดคำ + ตรวจสอบคำสะกดผิด)
- **Document Parsers:** `python-docx` (สกัด Heading, Margins, Font), `PyMuPDF` (สำหรับ PDF)
- **Database:** PostgreSQL (SQLAlchemy ORM + UUID)
- **Async Queue:** Celery + Redis
- **Storage:** S3-compatible Object Storage (MinIO / AWS S3)

---

## โครงสร้างโฟลเดอร์ (Directory Structure)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py               # จุดเริ่มต้น FastAPI app, CORS, lifespan
│   ├── router.py             # RESTful API endpoints (/templates, /analyze, /history)
│   ├── models.py             # SQLAlchemy models (PostgreSQL DDL)
│   ├── schemas.py            # Pydantic schemas ตรงกับ TypeScript types ของ Frontend
│   ├── database.py           # การเชื่อมต่อ Database และ Session
│   ├── crud.py               # Database queries และ operations
│   ├── nlp_engine.py         # ตัววิเคราะห์ภาษาไทยด้วย PyThaiNLP
│   ├── docx_parser.py        # ตัวแกะโครงสร้างเอกสาร .docx และ .pdf
│   ├── structure_checker.py  # ตัวตรวจสอบความสอดคล้องกับแม่แบบ (Template Compliance)
│   ├── storage.py            # จัดการไฟล์ผ่าน S3 / MinIO
│   ├── celery_app.py         # ตั้งค่า Celery worker
│   ├── tasks.py              # Celery background tasks
│   └── seed.py               # บันทึกแม่แบบมาตรฐาน 4 รายการลงฐานข้อมูลอัตโนมัติ
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## วิธีติดตั้งและรันระบบ (Quickstart)

### ทางเลือกที่ 1: รันผ่าน Docker Compose (แนะนำ)

```bash
cd backend
docker-compose up --build
```
ระบบจะเปิดบริการดังนี้:
- **FastAPI API & Docs:** http://localhost:8000/docs
- **PostgreSQL:** port 5432
- **Redis:** port 6379
- **MinIO Console:** http://localhost:9001 (User: `minioadmin` / Pass: `minioadmin`)

---

### ทางเลือกที่ 2: รันแบบ Local Python

1. ติดตั้ง Dependencies:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

2. ตั้งค่าตัวแปรสภาพแวดล้อม:
```bash
cp .env.example .env
```

3. รัน FastAPI Server (ให้รันจากโฟลเดอร์ `backend`):
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. รัน Celery Worker (อีก terminal หนึ่ง):
```bash
celery -A app.celery_app worker --loglevel=info
```

---

## API Endpoints หลัก

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/api/v1/templates` | รายการแม่แบบมาตรฐาน (วิทยานิพนธ์, รายงานโครงงาน, บทความวิจัย, เค้าโครง) |
| `POST` | `/api/v1/templates/upload` | อัปโหลดไฟล์แม่แบบเฉพาะ (.docx, .pdf) และตรวจจับหัวข้ออัตโนมัติ |
| `POST` | `/api/v1/analyze` | ส่งงานตรวจวิเคราะห์ (Async คืน `jobId`) |
| `GET` | `/api/v1/analyze/{jobId}` | Poll ตรวจสอบสถานะและรับผลการวิเคราะห์เต็มรูปแบบ |
| `GET` | `/api/v1/history?user_id=...` | ประวัติการส่งตรวจของผู้ใช้ |
| `GET` | `/health` | Health check endpoint |
