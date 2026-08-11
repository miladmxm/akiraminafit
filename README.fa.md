# فیت‌فلو

یک MVP فول‌استک برای مدیریت ارتباط مربی و شاگرد، کاملاً راست‌چین و قابل نصب به‌صورت PWA.

## امکانات

- دو نقش مربی و شاگرد با Better Auth
- مدیریت شاگردان و رابطه مربی/شاگرد
- کتابخانه حرکات با آپلود تصویر یا ویدیو در S3/MinIO
- برنامه‌ساز تمرینی با روز هفته، ست، تکرار، وزن و استراحت
- اجرای روزانه برنامه به‌صورت Todo و ثبت عملکرد واقعی
- صف IndexedDB برای همگام‌سازی Todo در حالت آفلاین
- ثبت تاریخچه وضعیت جسمانی و نمودارهای پیشرفت
- حالت Demo برای مشاهده فوری رابط بدون دیتابیس
- PostgreSQL، Drizzle ORM، migration و seed آماده

## اجرای سریع

پیش‌نیاز: Node.js 22.12 یا جدیدتر و Docker.

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:push
# ابتدا ADMIN_NAME و ADMIN_EMAIL و ADMIN_PASSWORD را در فایل .env مقداردهی کنید.
npm run db:seed
npm run dev
```

سپس این آدرس‌ها در دسترس هستند:

- وب: `http://localhost:5173`
- API: `http://localhost:3000`
- پنل MinIO: `http://localhost:9001`

## حالت Demo و حالت واقعی

در `.env.example` رابط در حالت Demo قرار دارد. برای اتصال رابط به API و Better Auth مقدار زیر را
تغییر دهید:

```env
VITE_DEMO_MODE=false
```

برای production هر دو مقدار `VITE_DEMO_MODE` و `DEMO_MODE` باید `false` باشند.

## ساخت حساب مربی اصلی

مقادیر `ADMIN_NAME`، `ADMIN_EMAIL` و `ADMIN_PASSWORD` را در فایل `.env` تنظیم و سپس
`npm run db:seed` را اجرا کنید. این فرمان فقط همان حساب را با نقش `coach` ایجاد یا به‌روزرسانی
می‌کند و هیچ شاگرد، حرکت، برنامه تمرینی یا گزارش نمونه‌ای نمی‌سازد. رمز عبور نیز در خروجی چاپ
نمی‌شود.

## فرمان‌ها

```bash
npm run dev
npm run build
npm run typecheck
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:seed
npm run verify:structure
```

## نکات production

- bucket رسانه را private کنید و signed read URL برگردانید.
- برای ویدیوها اسکن بدافزار، transcoding و thumbnail generation اضافه کنید.
- HTTPS، secret قوی، rate limiting و backup مدیریت‌شده PostgreSQL فعال شود.
- دسترسی عمومی MinIO در `docker-compose.yml` فقط برای توسعه محلی است.
