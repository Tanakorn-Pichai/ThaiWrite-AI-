# วิธีรันระบบ ThaiWrite AI

---

## 1. รัน Frontend (ง่ายที่สุด — พร้อมใช้งานทันที)

เปิด Terminal ที่ root directory:

```bash
# 1. ติดตั้ง dependencies (ทำครั้งแรกครั้งเดียว)
npm install

# 2. รันโปรแกรม (Development Mode)
npm run dev
```

เปิด browser ไปที่: **http://localhost:3000**  
หากทดสอบจากเครื่องอื่นในเครือข่ายเดียวกัน ให้เปิดผ่าน IP ของเครื่องนี้ เช่น `http://192.168.1.36:3000` และต้องเปิด Backend ให้รับการเชื่อมต่อจากเครือข่ายด้วย

> Frontend ใช้ Backend จริงเท่านั้น หาก Backend ปิดอยู่ ระบบจะแสดงข้อผิดพลาดและจะไม่สร้างผลวิเคราะห์จำลอง

---

## 2. รัน Backend (FastAPI + PyThaiNLP)

### ทางเลือกที่ 1: รันด้วย Docker Compose (แนะนำคำสั่งเดียวจบ)

```bash
cd backend
docker-compose up --build
```

---

### ทางเลือกที่ 2: รันแบบ Local Python

```bash
cd backend

# สร้าง Virtual Environment (ทำครั้งแรก)
python -m venv venv

# เปิดใช้งาน Virtual Environment
# - PowerShell:
.\venv\Scripts\activate
# - Git Bash:
source venv/Scripts/activate
# - macOS / Linux:
source venv/bin/activate

# ติดตั้ง dependencies
pip install -r requirements.txt

# ตั้งค่า Gemini (ถ้าต้องการตรวจไวยากรณ์เชิงลึก)
# สร้าง backend/.env จาก backend/.env.example แล้วใส่ API key ที่หมุนใหม่ของคุณ
# เปิดใช้งานด้วย ENABLE_GEMINI_GRAMMAR=true

# สตาร์ท FastAPI Server (รันจากโฟลเดอร์ backend)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API & Swagger Docs: **http://localhost:8000/docs**

---

## 💡 สรุป Port & การแก้ปัญหาเบื้องต้น

| บริการ (Service) | URL | หมายเหตุ |
|---|---|---|
| **Frontend** | http://localhost:3000 | หน้าเว็บหลัก |
| **Backend API** | http://localhost:8000 | RESTful API |
| **API Docs (Swagger)** | http://localhost:8000/docs | ทดสอบ API |

### ข้อควรรู้
- **Git Bash บน Windows:** ให้ใช้ `source venv/Scripts/activate` ในการเปิด venv
- **รัน uvicorn:** ควรใช้คำสั่ง `python -m uvicorn app.main:app --reload --port 8000` เพื่อป้องกันปัญหา `ModuleNotFoundError`
- **หาก Backend ปิดอยู่:** Frontend จะทำการ Fallback ไปใช้ระบบจำลอง (Mock Data) อัตโนมัติ ทำให้ผู้ใช้ยังทดสอบ UI และตรวจเอกสารเบื้องต้นได้
