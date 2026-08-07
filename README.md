# چت‌بات سبک زندگی/سلامت (MVP)

MVP یک چت‌بات تریاژِ سبک زندگی/سلامت برای بازار ایران. تمام پاسخ‌ها با منطق rule-based در بک‌اند تولید می‌شوند — بدون اتصال به هیچ LLM خارجی.

## ساختار

- `backend/` — Express + TypeScript + Postgres (Neon). شامل منطق تریاژ در `backend/src/triage/`.
- `frontend/` — React + Vite + TypeScript. شامل فرم Intake، صفحه‌ی نتیجه، پیگیری روزانه، و پنل ادمین (`/admin`).
- `api/` — نقطه‌ورود سرورلسِ Vercel که همان اپ Express بک‌اند رو دوباره export می‌کنه (برای دیپلوی).
- ریشه‌ی مخزن (`package.json`, `vercel.json`) — فقط برای دیپلوی روی Vercel، شامل کد اجرایی نیست.

## اجرا (توسعه)

نیاز به یک دیتابیس Postgres دارید (مثلاً Neon، رایگان). یک فایل `backend/.env` بسازید (بر اساس `backend/.env.example`) با connection string واقعی‌تون:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

### بک‌اند
```bash
cd backend
npm install
npm run dev      # روی http://localhost:4000
npm run test     # تست‌های واحد منطق تریاژ (به دیتابیس نیازی ندارد)
```

### فرانت‌اند
```bash
cd frontend
npm install
npm run dev       # روی http://localhost:5173 با پراکسی به بک‌اند
```

## دیپلوی روی Vercel

پروژه به‌صورت یک پروژه‌ی واحد روی Vercel دیپلوی می‌شود: فرانت‌اند به‌عنوان static build، بک‌اند به‌عنوان یک تابع سرورلس زیر `/api`. متغیر محیطی `DATABASE_URL` (connection string واقعی Neon) باید در تنظیمات پروژه‌ی Vercel ست بشه، نه در فایل.

## منطق تریاژ

سؤالات Intake در ۶ گروه (A تا F: پرچم‌های ایمنی، خواب، استرس، سابقه‌ی رژیم، فعالیت بدنی، هدف) پرسیده می‌شوند و تابع `computeTrack` در `backend/src/triage/rules.ts` بر اساس اولویتِ محدودکننده‌ترین مسیر، یکی از ۵ مسیر را تعیین می‌کند و متنِ از‌پیش‌نوشته‌شده (`backend/src/triage/templates.ts`) را برمی‌گرداند.
