# Admin App (standalone)

پنل ادمین، پروژه‌ای کاملاً مجزا از اپ اصلی (چت‌بات) است. فقط برای خواندن داده‌ها (کاربران، مسیر تریاژ، آمار) از همان دیتابیس Postgres استفاده می‌کند و backend/frontend مستقل خودش را دارد.

## اجرا (local dev)

```bash
# backend (پورت پیش‌فرض 4100)
cd admin-app/backend
cp .env.example .env   # DATABASE_URL را با کانکشن‌استرینگ Neon پر کن
npm install
npm run dev

# frontend (پورت پیش‌فرض 5174، با پراکسی به بک‌اند بالا)
cd admin-app/frontend
npm install
npm run dev
```

## دیپلوی

این پروژه از `frontend`/`backend` اصلی کاملاً جداست و باید جدا دیپلوی شود (مثلاً یک پروژه‌ی دیگر روی Vercel، یا هر سرویس دیگری). فقط نیاز به همان `DATABASE_URL` دارد؛ هیچ جدولی نمی‌سازد (migration را اپ اصلی انجام می‌دهد) و فقط از جداول موجود (`users`, `intake_responses`, `daily_logs`) می‌خواند.
