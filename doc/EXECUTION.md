# اجرای مرحله‌ای و ثبت پیشرفت

این فایل دفتر اجرای فعال است؛ [ROADMAP.md](./ROADMAP.md) وضعیت کلان و taskها را نگه می‌دارد. اطلاعات برند در این فایل تکرار نمی‌شود.

## وضعیت فعلی

- R01 تکمیل شد؛ هر هفت تسک DONE هستند.
- خروجی: پروژه محلی، دو زبان/جهت، سه انتخاب تم، لوگوی تأییدشده، config generator، env validation، Query provider و CI اولیه.
- آخرین بررسی پس از R01-FIX-001: ۱۶ تست واحد، ۸ تست dev و ۸ تست production پاس؛ console.error در regression ثبت و بررسی شد؛ lint، typecheck، format و build پاس.
- قدم بعد: R02-T01 برای تکمیل هویت/فونت و طراحی؛ R03 نیز از نظر وابستگی آماده است، هنوز آغاز نشده.
- دیتابیس، auth اجرایی، پرداخت و AI هنوز پیاده‌سازی نشده‌اند؛ انتخاب auth برابر Better Auth است.
- مانع فعال R01: ندارد؛ اطلاعات مراحل آینده در OWNER_INPUT باز است.
## پروتکل هر task

۱. وابستگی و شرط شروع را بخوان؛ task مناسب را در ROADMAP به IN_PROGRESS ببر.
۲. هدف، محدوده و معیار پذیرش را در این فایل ثبت کن؛ کار مستقل را به دلیل اطلاعات آینده متوقف نکن.
۳. اجرا، تست متناسب و به‌روزرسانی اسناد مرتبط.
۴. نتیجه و evidence واقعی را ثبت؛ در صورت نبود پیش‌نیاز فقط task وابسته BLOCKED شود و OI/issue مربوط مشخص گردد.
۵. task به VERIFYING و پس از عبور معیار پذیرش به DONE برود. نظر طراحی مورد نیاز در REVIEW ثبت شود، بدون جعل تأیید مالک.
۶. خلاصه قابل فهم به مالک بده؛ مرحله بعد از آخرین وضعیت ادامه پیدا کند، نه از ابتدا.

## قالب ثبت کار

```text
Task ID:
State:
Goal / scope:
Dependencies:
Changes / files:
Checks (command, environment, result):
Evidence / artifact:
Open issues / owner-input ID:
Next action:
```

## تصمیم‌ها

| شناسه | وضعیت | تصمیم و دلیل | اثر |
| --- | --- | --- | --- |
| DEC-001 | پذیرفته‌شده | مقادیر برند فقط BUSINESS_CONFIG؛ OWNER_INPUT فقط پیگیری پرسش | تغییر هویت متمرکز |
| DEC-002 | پذیرفته‌شده | همه اسناد در doc؛ PRODUCT و QUALITY مرجع دامنه و کیفیت | مسیر قابل پیدا کردن و پرهیز از نسخه موازی |
| DEC-003 | طراحی اولیه | endpointها تا انتخاب کتابخانه و سرویس PLANNED بمانند | ادعای قابلیت موجود نشود |

## شواهد مستندسازی

کنترل ساختاری فایل‌ها، پیوندها، code fenceها و شناسه‌های task پس از ویرایش اجرا می‌شود. نتیجه این کنترل، تأیید فنی برنامه یا تکمیل کیفیت runtime محسوب نمی‌شود. وضعیت R00 فقط پس از موفقیت این بررسی ثبت می‌شود.

## نتیجه R00-T04 — ۲۰۲۶-۱۰-۳۰

State: DONE. کنترل با PowerShell روی تمام Markdownها اجرا شد: ۲۲ نام درخواستی در مجموعه مستندات، ۲۵ فایل در مجموع، ۴۲ پیوند محلی سالم، code fenceهای متوازن، فایل‌های غیرخالی و ۷۶ task یکتا با state معتبر. جست‌وجوی مسیر قدیمی docs/ARCHITECTURE.md و docs/ROADMAP.md نتیجه‌ای نداشت؛ exit code جست‌وجوی بدون نتیجه به معنی شکست بررسی ساختار نیست.

R00 تکمیل و R01/R01-T01 آماده شروع ثبت شدند؛ هیچ برنامه، وابستگی یا سرویس نصب/متصل نشده است. قدم بعدی بررسی نسخه‌ها هنگام شروع پیاده‌سازی است. کنترل YAML در حد متن است؛ parser و validation معنایی در R01-T03 ساخته می‌شوند. این شواهد تأیید runtime، امنیت یا عملکرد نیستند.


## انتقال مستندات و آغاز طراحی لوگو — ۲۰۲۶-۱۰-۳۰

به درخواست مالک، ۲۵ فایل Markdown به doc منتقل و لینک‌های محلی اصلاح شدند. سیاست آخرین نسخه پایدار رسمی در TECH_STACK ثبت شد. کنترل پس از انتقال: 42 لینک محلی سالم. چهار کانسپت لوگو با ابزار داخلی imagegen در حال تولید است؛ انتخاب نهایی با مالک، R02 کامل نشده و bootstrap هنوز شروع نشده است. این کار طراحی بنا به درخواست مالک پیش از وابستگی اجرایی R02 انجام می‌شود.


چهار تصویر کانسپت ساخته، بصری بررسی و در assets/logo-concepts ذخیره شدند. promptهای کامل و روش تولید در LOGO_CONCEPTS.md ثبت‌اند. انتخاب مالک در انتظار است؛ ایراد نقطه‌گذاری نوشتار فارسی در برخی کانسپت‌ها در مرحله نهایی اصلاح می‌شود. هیچ طرحی فعلاً به‌عنوان لوگوی برند در BUSINESS_CONFIG انتخاب نشده است.


## اصلاح لوگو — ۲۰۲۶-۱۰-۳۰
مالک گزینه 02 را پسندید و حذف متن، بهبود فرم و افزودن سبد را خواست. نسخه concept-02-v2-cart.png با ابزار داخلی imagegen ساخته و بصری بررسی شد: مونوگرام DS، حذف تمام نوشته‌ها، دسته و دو چرخ سبد، زمینه شفاف در خروجی درخواست‌شده. نسخه اصلی حفظ شد؛ تأیید نهایی اصلاح جدید هنوز دریافت نشده است.


## SVG سازگار با تم — ۲۰۲۶-۱۰-۳۰

مالک لوگوی اصلاح‌شده و ترکیب سرمه‌ای/سبز را پسندید و SVG با رنگ متغیر خواست. بازطراحی هندسی در assets/brand/digishop-mark.svg با path/circle واقعی و دو CSS variable ساخته شد؛ raster یا متن جاسازی‌شده ندارد. BUSINESS_CONFIG با مسیر لوگو و رنگ‌های روشن/تاریک به‌روز شد. CSS نمونه و preview HTML سه حالت روشن، تاریک و تک‌رنگ آماده‌اند. XML با موفقیت parse و نبود script/image/text و وجود توکن‌ها بررسی شد.

رندر بصری خودکار انجام نشد: مرورگر headless محلی راه نیفتاد و ابزار مرورگر file URL را به دلیل سیاست امنیتی نپذیرفت؛ مسیری برای دور زدن آن اجرا نشد. preview HTML برای بررسی دستی آماده است؛ تأیید بصری SVG هنوز باقی است. محدودیت img در ارث‌بری CSS در LOGO_SVG.md ثبت شد. این خروجی تکمیل کل R02 نیست.

## تحویل R01 — ۲۰۲۶-۱۰-۳۰

مجوز مالک: راه‌اندازی مرحله اول با آخرین فناوری‌های پایدار؛ حفظ لوگو و پالت تأییدشده. این ثبت جایگزین وضعیت جاری قبل از پیاده‌سازی است؛ یادداشت‌های قبلی تاریخچه‌اند.

| Task | خروجی | Evidence |
| --- | --- | --- |
| R01-T01 | Node محلی 26.13.0 LTS و pnpm 12.16.1، بسته‌های pin و lockfile | checksum رسمی Node و integrity بسته pnpm، نصب frozen و peers check |
| R01-T02 | Next 16.4.3، React 19.3.1، TS7، Tailwind، shadcn scaffold، lint/format | check و build موفق |
| R01-T03 | YAML parser، Zod، public config حداقلی، geometry و CSS/asset تولیدی | config:check و تست config/rebrand/unsafe asset |
| R01-T04 | env server-only، نمونه local/test و validation شرطی | env:check و تست feature credentials، secret redaction و test DB |
| R01-T05 | next-intl، fa/en، proxy، root redirect و جهت سند | ۲۷ پیام معتبر، language switch و HTTP 404 واقعی |
| R01-T06 | QueryClient factory، provider، keyهای account/locale و پاک‌سازی خصوصی؛ error boundary | تست isolation و logout cleanup؛ UI error/retry ترجمه‌شده |
| R01-T07 | workflow و کنترل‌های محلی، build و تست مرورگر | نتایج زیر؛ workflow ابری هنوز اجرا نشده |

### بررسی نهایی

محیط: Windows x64، ابزار محلی .tools؛ build و browser تحت دسترسی عادی کاربر به native cache (از طریق اجرای خارج sandbox محدود). هیچ تنظیم امنیتی سیستم ضعیف نشده و Node/pnpm سراسری عوض نشده‌اند.

- `pnpm check`: PASS؛ config/env/i18n، Oxlint بدون warning، route typegen، `tsc --noEmit`، ۴ فایل Vitest/۱۶ تست و Prettier.
- `pnpm build`: PASS با Turbopack؛ خطای TS نادیده گرفته نشده؛ فرانت HTML سمت سرور دارد.
- `PLAYWRIGHT_CHANNEL=msedge pnpm test:e2e`: PASS، ۵ تست روی production build؛ fa/en و RTL/LTR، عنوان/متن سروری، تعویض زبان، تم و persistence، رنگ تطبیقی لوگو، عرض‌های ۳۲۰/۳۶۰، keyboard skip/focus، redirect پیش‌فرض، 404 locale/path و نبود نام secrets در HTML.
- `pnpm exec tsc --version`: 7.0.2؛ `pnpm peers check`: بدون conflict.
- `pnpm config:release`: رد مورد انتظار با فهرست اطلاعات واقعی ناقص؛ guard انتشار کار می‌کند و با موفقیت build اشتباه گرفته نشده.
- screenshots روشن/تاریک desktop و روشن mobile برای هر زبان در `output/r01/` ثبت شدند؛ نمای فارسی روشن موبایل و دسکتاپ و انگلیسی تاریک بصری بررسی شدند. خروجی‌ها gitignored هستند.

### تصمیم‌ها و محدودیت‌ها

DEC-004: آخرین TypeScript 7.0.2 API قدیمی موردنیاز Next/typescript-eslint را ندارد. مطابق راهنمای رسمی Microsoft، alias @typescript/native برای compiler7 و typescript به آخرین compatibility package رسمی @typescript/typescript6@6.0.2 نگاشت شد. Next از API سازگار و check مستقل از compiler7 استفاده می‌کند؛ این موضوع پیش از تغییر به مالک توضیح داده شد.

DEC-005: lint قبلی با جدیدترین typescript-eslint شکست خورد؛ Oxlint 1.90.0 جایگزین ESLint شد تا TS7 باقی بماند. قواعد React/hooks، Next، TypeScript و jsx-a11y فعال‌اند. بررسی نهایی peerها پاک است؛ conflict مخفی نشده.

DEC-006: Better Auth برای credentials و adapter Prisma انتخاب؛ نصب/ورود واقعی R04. Prisma latest به RC اشاره داشت؛ 7.10.1 آخرین stable مشاهده شد و نصب در R03 پس از بررسی مجدد انجام می‌شود.

دانلود Chromium رسمی با 403 منطقه‌ای شکست خورد؛ Edge نصب‌شده برای تست استفاده شد و تمام تست‌ها پاس شدند. CI از Chromium رسمی استفاده می‌کند؛ تا push اجرای GitHub Actions تأیید نشده. هنوز ارزیابی کامل WCAG، Lighthouse/field CWV یا تست تجاری انجام نشده؛ این‌ها مربوط به مراحل بعدند. اصلاح موبایل لازم در حین تست انجام شد: decorative orbit از container بیرون می‌زد و با clipping همان بخش تزئینی رفع شد.

به درخواست مالک bootstrap را در R01 نگه داشتیم. R02 و R03 READY؛ توسعه فروشگاه یا انتشار انجام نشده. راه‌اندازی: `./scripts/pnpm.ps1 dev` در PowerShell؛ آموزش کامل در DEVELOPMENT.

## R01-FIX-001 — رفع خطای script در ThemeProvider — ۲۰۲۶-۱۰-۳۰

State: DONE. گزارش مالک با dev/Turbopack و تست جدید theme-navigation بازتولید شد: next-themes اسکریپت inline را هنگام navigation سمت کلاینت رندر می‌کرد. تست اولیه fail شد و console.error متن دقیق گزارش‌شده را ثبت کرد. تست‌های تحویل قبلی فقط pageerror داشتند؛ بنابراین ادعای آن تحویل شامل پاک بودن کنسول dev نبود و این خلأ اکنون رفع شد.

تغییر نهایی: next-themes از package و lockfile حذف؛ ThemeProvider محلی بدون script با useSyncExternalStore، storage/media listener و حافظه preference مستقل از تغییر locale. bootstrap خارجی کوچک تولیدشده با async/src در root layout از پشتیبانی resource script خود React استفاده می‌کند. گزینه next/script beforeInteractive در آزمایش هنوز به inline script ختم شد و regression را پاس نکرد؛ در نتیجه در کد نهایی وجود ندارد. هیچ console filter، خاموش کردن StrictMode یا پنهان کردن خطا استفاده نشده است.

نکات مکمل: data-scroll-behavior مناسب html و icon SVG برای رفع درخواست favicon بدون مسیر؛ defaultTheme همچنان از BUSINESS_CONFIG. رنگ/لوگو/متن‌ها تغییر نکردند. storage مسدود با fallback حافظه کار می‌کند، ولی persistence بعد از hard reload در چنین مرورگری تضمین نمی‌شود.

Evidence نهایی روی Windows/Edge نصب‌شده:

- `pnpm check`: PASS؛ ۱۶ unit test، config/env/i18n، Oxlint، TS7 و Prettier.
- `PLAYWRIGHT_CHANNEL=msedge pnpm test:e2e:dev --workers=2`: PASS، ۸ تست روی Next dev واقعی در 3100 با dist مستقل .next-e2e-dev؛ بدون خطای console.error/pageerror در regression.
- `pnpm build`: PASS با Next 16.4.3/Turbopack، بررسی TS فعال.
- `PLAYWRIGHT_CHANNEL=msedge pnpm test:e2e --workers=2`: PASS، ۸ تست روی production server تازه در 3200.
- regression: تغییر fa/en و جهت سند با حفظ تم، light/dark/system و media changes، reload، همگام‌سازی دو تب و storage مسدود.

تست production ابتدا به دلیل reuseExistingServer به instance موجود 3000 متصل شد و شاهد معتبر production نبود؛ reuse خاموش و پورت تولید آزمون به 3200 منتقل شد، سپس suite روی سرور تازه پاس شد. سرور شخصی مالک متوقف یا تنظیمات آن تغییر داده نشد. در صورت داشتن dev قدیمی پس از تغییر dependency یا build، یک بار dev را دوباره اجرا کنید.

workflow به تست dev نیز مجهز شد؛ اجرا در GitHub هنوز تأیید نشده است. DEVELOPMENT، TESTING، UI، TECH_STACK، BUSINESS_CONFIG و ROADMAP همگام شدند. Next dev یک AGENTS.md ریشه خودکار ساخت؛ دستور خواندن مستندات محلی Next بررسی شد و آن فایل حفظ شد.

## پاک‌سازی پیش از GitHub — ۲۰۲۶-۱۰-۳۰

به درخواست مالک، PNGهای کانسپت، HTML/CSS پیش‌نمایش قدیمی، پروفایل موقت مرورگر، screenshots و گزارش‌های تست، build آزمایشی dev، tsbuildinfo و پوشه خالی docs حذف شدند. SVG نهایی، همه مستندات، سورس، تست، CI و lockfile حفظ شدند. node_modules، .tools و cache اصلی .next برای ادامه اجرای محلی نگه داشته و gitignored هستند. .gitignore برای log و فایل‌های سیستم تکمیل و .gitattributes برای LF ثابت اضافه شد. تاریخچه promptها حفظ ولی وضعیت دارایی‌های حذف‌شده روشن شد. مخزن هنوز Git init یا به GitHub push نشده است.

