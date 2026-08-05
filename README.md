# چت‌بات سبک زندگی/سلامت (MVP)

MVP یک چت‌بات تریاژِ سبک زندگی/سلامت برای بازار ایران. تمام پاسخ‌ها با منطق rule-based در بک‌اند تولید می‌شوند — بدون اتصال به هیچ LLM خارجی.

## ساختار

- `backend/` — Express + TypeScript + SQLite. شامل منطق تریاژ در `backend/src/triage/`.
- `frontend/` — React + Vite + TypeScript. شامل فرم Intake، صفحه‌ی نتیجه، پیگیری روزانه، و پنل ادمین (`/admin`).

## اجرا (توسعه)

### بک‌اند
```bash
cd backend
npm install
npm run dev      # روی http://localhost:4000
npm run test     # تست‌های واحد منطق تریاژ
```

### فرانت‌اند
```bash
cd frontend
npm install
npm run dev       # روی http://localhost:5173 با پراکسی به بک‌اند
```

## منطق تریاژ

سؤالات Intake در ۶ گروه (A تا F: پرچم‌های ایمنی، خواب، استرس، سابقه‌ی رژیم، فعالیت بدنی، هدف) پرسیده می‌شوند و تابع `computeTrack` در `backend/src/triage/rules.ts` بر اساس اولویتِ محدودکننده‌ترین مسیر، یکی از ۵ مسیر را تعیین می‌کند و متنِ از‌پیش‌نوشته‌شده (`backend/src/triage/templates.ts`) را برمی‌گرداند.
