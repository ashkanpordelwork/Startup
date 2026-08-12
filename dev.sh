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

echo "⏳ منتظر آماده شدن کامل بک‌اند..."
for i in $(seq 1 30); do
  if curl -s http://localhost:4000 > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo "🚀 روشن کردن فرانت‌اند روی پورت 5173..."
(cd frontend && npm run dev) &

wait
