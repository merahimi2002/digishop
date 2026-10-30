# توسعه محلی

پایه R01 اجرایی است. Node 26.13.0 LTS و pnpm 12.16.1 pin شده‌اند؛ ابزارهای محلی ویندوز در .tools قرار دارند و نصب سراسری تغییر نکرده است. برای R01 به دیتابیس، API key یا سرویس خارجی نیاز نیست.

## اجرای سریع در PowerShell

از ریشه پروژه:

```powershell
# ابزار محلی از قبل آماده است:
.\scripts\pnpm.ps1 dev
```

سپس http://localhost:3000/fa یا http://localhost:3000/en را باز کنید. برای بازسازی ابزارهای همین نسخه در Windows x64، با Node موجود `node scripts/bootstrap-tools.mjs` را اجرا کنید؛ binary رسمی Node با SHA256 و بسته pnpm با SHA512 کنترل می‌شود. برای سیستم دیگر نسخه‌های pin‌شده را با روش رسمی همان سیستم نصب و از `pnpm` معمول استفاده کنید. helper از نسخه ثبت‌شده استفاده می‌کند، نه ارتقای خودکار در هر اجرا.

در checkout تازه پس از آماده‌سازی runtime:

```powershell
.\scripts\pnpm.ps1 install --frozen-lockfile
.\scripts\pnpm.ps1 config:generate
.\scripts\pnpm.ps1 dev
```

کپی `.env.example` به `.env.local` اختیاری است؛ برای R01 مقدار پیش‌فرض کافی است. فایل واقعی env را commit نکنید. دیتابیس و auth در R03/R04 اضافه می‌شوند؛ اسکریپت db:migrate/db:seed هنوز وجود ندارد.

## فرمان‌های واقعی

| فرمان pnpm | کاربرد |
| --- | --- |
| dev | تولید تنظیمات و اجرای توسعه |
| build / start | تولید تنظیمات و build؛ سپس اجرای production محلی |
| check | config، env، ترجمه، lint، typecheck، unit test و format |
| lint / lint:fix | Oxlint و اصلاح‌های ایمن |
| typecheck | تولید route type با Next و tsc نسخه 7 |
| test / test:watch | Vitest |
| test:e2e | Playwright روی build تولید؛ ابتدا build اجرا شود |
| test:e2e:dev | Playwright روی dev مستقل، بدون نیاز به build قبلی |
| format / format:check | Prettier |
| config:generate / config:check | تولید/بررسی خروجی از doc/BUSINESS_CONFIG.md |
| config:release | رد تنظیمات ناقص فروش واقعی؛ اکنون fail مورد انتظار است |
| env:check / i18n:check | کنترل محیط و پیام‌های زبان |

برای تغییر برند/لوگو/رنگ فایل مرکزی را ویرایش و generate یا dev/build را اجرا کنید. فایل خروجی را دستی تغییر ندهید. پیام زبان در messages قرار دارد؛ زبان جدید به پیام و QA واقعی نیاز دارد.

## مرورگر آزمون

در محیطی که دانلود رسمی در دسترس است: `pnpm exec playwright install chromium` و سپس `pnpm test:e2e`. دانلود Chromium در این دستگاه پاسخ 403 منطقه‌ای داد؛ آزمون با Edge نصب‌شده اجرا شد:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
.\scripts\pnpm.ps1 build
.\scripts\pnpm.ps1 test:e2e
```

در CI از Chromium رسمی استفاده می‌شود؛ workflow آماده است ولی تا push به GitHub اجرای ابری آن تأیید نشده. screenshots محلی در output/r01 و trace خطا در test-results هستند؛ این خروجی‌ها gitignored هستند. در sandbox محدود ممکن است SWC به cache امن کاربر دسترسی نداشته باشد؛ بررسی‌های ثبت‌شده با دسترسی عادی کاربر اجرا شده‌اند، بدون تغییر تنظیم امنیتی.

## جریان کار

### بررسی dev و ThemeProvider

برای بررسی دقیق navigation و کنسول React در ویندوز:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
.\scripts\pnpm.ps1 test:e2e:dev --workers=2
```

آزمون dev پورت 3100 و `.next-e2e-dev` را مالک است؛ آزمون production روی پورت 3200 اجرا می‌شود. هیچ suite سرور موجود پورت 3000 را reuse یا متوقف نمی‌کند. برای آزمون production ابتدا build لازم است؛ هم‌زمان با dev شخصی build نگیرید چون خروجی اصلی .next مشترک است. پس از حذف next-themes، سرور dev قدیمی را یک بار دوباره اجرا کنید تا graph وابستگی قبلی کنار گذاشته شود.

Next dev فایل AGENTS.md ریشه را خودکار ایجاد می‌کند که به راهنماهای همراه همین نسخه Next اشاره دارد؛ آن بلوک را حذف نکنید. مستندات محصول و اجرا همچنان در doc هستند.

از ROADMAP task آماده را انتخاب و evidence را در EXECUTION ثبت کنید. داده نمونه از تولید جداست؛ اتصال پرداخت/ایمیل/AI را بدون اجرای واقعی موفق معرفی نکنید. تست متناسب با تغییر کافی است؛ در شکست واقعی اصلاح و تکرار کنید.
