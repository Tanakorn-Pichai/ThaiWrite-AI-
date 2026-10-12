# 🚀 คู่มือ Deploy ThaiWrite AI (Vercel + Render)

## สถาปัตยกรรม

```
ผู้ใช้ → Vercel (React Frontend) → Render (FastAPI Backend) → SQLite
```

---

## 1. Deploy Backend บน Render

### 1.1 สร้าง Web Service
1. ไปที่ [render.com](https://render.com) แล้ว Sign Up / Login
2. กด **New +** → **Web Service**
3. เชื่อมต่อ GitHub repo ของโปรเจกต์นี้
4. ตั้งค่า:

| ตั้งค่า | ค่า |
|---|---|
| **Name** | `thaiwrite-api` |
| **Region** | Singapore (ใกล้ไทย) |
| **Root Directory** | `backend` |
| **Runtime** | Docker |
| **Instance Type** | Free |

### 1.2 ตั้ง Environment Variables บน Render
กดที่ **Environment** แล้วเพิ่ม:

```
FRONTEND_ORIGINS = https://your-app-name.vercel.app
ENABLE_GEMINI_GRAMMAR = false
USE_CELERY = false
USE_S3 = false
PORT = 8000
MAX_UPLOAD_SIZE_MB = 10
```

> 💡 ยังไม่ต้องตั้ง DATABASE_URL — ระบบจะใช้ SQLite อัตโนมัติ
> ⚠️ SQLite บน free tier จะ reset เมื่อ redeploy (history จะหาย) ถ้าต้องการเก็บข้อมูลถาวรใช้ Supabase PostgreSQL

### 1.3 Deploy
กด **Create Web Service** แล้วรอ build (ครั้งแรกประมาณ 5-10 นาที)

เมื่อเสร็จจะได้ URL เช่น:
```
https://thaiwrite-api.onrender.com
```

### 1.4 ทดสอบ Backend
เปิดเบราว์เซอร์ไปที่:
```
https://thaiwrite-api.onrender.com/health
```
ต้องเห็น: `{"status":"ok","service":"ThaiWrite AI Backend"}`

---

## 2. Deploy Frontend บน Vercel

### 2.1 สร้าง Project
1. ไปที่ [vercel.com](https://vercel.com) แล้ว Sign Up / Login
2. กด **Add New...** → **Project**
3. Import GitHub repo ของโปรเจกต์นี้
4. Vercel จะตรวจพบว่าเป็น Vite project อัตโนมัติ

### 2.2 ตั้ง Environment Variables บน Vercel
ก่อนกด Deploy ให้เพิ่ม Environment Variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://thaiwrite-api.onrender.com/api/v1` |

> ⚠️ เปลี่ยน `thaiwrite-api` เป็นชื่อ service จริงของคุณบน Render

### 2.3 Deploy
กด **Deploy** แล้วรอ build (ประมาณ 1-2 นาที)

เมื่อเสร็จจะได้ URL เช่น:
```
https://thaiwrite-ai.vercel.app
```

---

## 3. เชื่อมต่อ Frontend ↔ Backend

### 3.1 อัปเดต CORS บน Render
กลับไปที่ Render → Environment Variables → แก้ไข:

```
FRONTEND_ORIGINS = https://thaiwrite-ai.vercel.app
```

> ใส่ URL จริงของ Vercel (ไม่ต้องมี / ตามหลัง)

### 3.2 Redeploy Backend
กด **Manual Deploy** → **Deploy latest commit** บน Render

---

## 4. ทดสอบระบบ

1. เปิด `https://thaiwrite-ai.vercel.app`
2. พิมพ์ข้อความทดสอบ เช่น: `นักศึกษาต้องทำเรื่องขออนุณาติอาจารย์ที่ปรึกษาก่อนลงทะเบียน`
3. เลือกระดับภาษา → กดตรวจ
4. ตรวจสอบว่าผลลัพธ์แสดงถูกต้อง

---

## 5. (ถ้าต้องการ) เปิด Gemini Grammar

เพิ่ม env บน Render:
```
ENABLE_GEMINI_GRAMMAR = true
GEMINI_API_KEY = your-gemini-api-key
GEMINI_MODEL = gemini-2.5-flash
```

---

## ⚠️ ข้อจำกัด Free Tier

| บริการ | ข้อจำกัด |
|---|---|
| **Render Free** | Backend จะ sleep หลังไม่มีการใช้งาน 15 นาที, request แรกจะช้า ~30-60 วินาที |
| **Vercel Free** | ไม่จำกัดสำหรับ static site, bandwidth 100GB/เดือน |
| **SQLite** | ข้อมูลจะหายเมื่อ redeploy (ใช้ Supabase ถ้าต้องการถาวร) |

---

## โครงสร้างไฟล์ที่เพิ่ม/แก้

```
ThaiWrite-AI/
├── vercel.json          ← ใหม่: config Vercel frontend
├── vite.config.ts       ← แก้: ลบ __dirname warning
├── DEPLOY.md            ← ใหม่: คู่มือนี้
└── backend/
    ├── Dockerfile       ← แก้: รองรับ PORT env
    └── render.yaml      ← ใหม่: config Render backend
```
