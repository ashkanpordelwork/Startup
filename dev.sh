#!/usr/bin/env bash
# اجرای همزمان بک‌اند و فرانت‌اند با یک دستور.
# استفاده: از ریشه‌ی پروژه بزن  ./dev.sh
set -e

if [ ! -f backend/.env ]; then
  echo "⚠️  backend/.env پیدا نشد. اول اون رو بساز (DATABASE_URL, JWT_SECRET, AI_PROVIDER, AVALAI_API_KEY)."
  exit 1
fi

cleanup() {
  echo ""
  echo "در حال متوقف کردن سرورها..."
  kill 0
}
trap cleanup EXIT INT TERM

echo "🚀 نصب وابستگی‌ها (اگه قبلاً نصب نشده باشن، کمی طول می‌کشه)..."
(cd backend && npm install --silent)
(cd frontend && npm install --silent)

echo "🚀 روشن کردن بک‌اند روی پورت 4000..."
(cd backend && npm run dev) &

echo "🚀 روشن کردن فرانت‌اند روی پورت 5173..."
(cd frontend && npm run dev) &

wait
