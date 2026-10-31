# اجرای مرحله‌ای و ثبت پیشرفت

این فایل دفتر اجرای فعال است؛ [ROADMAP.md](./ROADMAP.md) وضعیت کلان و taskها را نگه می‌دارد. اطلاعات برند در این فایل تکرار نمی‌شود.

## وضعیت فعلی

- R01 تکمیل شد؛ هر هفت تسک DONE هستند.
- خروجی: پروژه محلی، دو زبان/جهت، سه انتخاب تم، لوگوی تأییدشده، config generator، env validation، Query provider و CI اولیه.
- آخرین بررسی R02: ۱۶ تست واحد، ۱۴ تست dev و ۱۴ تست production پاس؛ axe و regression کنسول/تم/زبان نیز پاس؛ lint، typecheck، format و build پاس.
- R02: پیش‌نمایش خانه و محصول/دیالوگ آماده REVIEW مالک؛ T01 تا T04 تکمیل، T05/T06 منتظر بازخورد طراحی. R03 هنوز آغاز نشده.
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


## آغاز R02 — فونت و بازطراحی

مالک اعلام کرد پروژه را روی GitHub منتشر کرده و IRANSans فارسی و بازطراحی UI انیمیشنی می‌خواهد. فایل فونت در workspace یافت نشد؛ اتصال واقعی next/font/local تا دریافت فایل در OI-20 باز است. هیچ فونت جایگزینی به نام IRANSans معرفی و هیچ فایل ناشناسی دانلود نشد. UI فعلی صفحه پایه R01 است، نه طراحی نهایی storefront. R02 و R02-T01 در IN_PROGRESS؛ فونت و اجرای طراحی نهایی هنوز انجام نشده‌اند. درخواست فایل WOFF2 و مرجع بصری اختیاری مطرح می‌شود؛ باقی انتخاب‌های معمول طراحی با دستیار است.

## اجرای R02 — Vazirmatn و پیش‌نمایش فروشگاه لوکس — ۲۰۲۶-۱۰-۳۰

State: REVIEW (بازخورد طراحی مالک هنوز دریافت نشده). مالک جهت لوکس و خلوت با hero جسورانه، حفظ لوگو/پالت و Vazirmatn با import از Fontsource را انتخاب کرد و طراحی مستقل را مجاز دانست. درخواست قبلی IRANSans superseded و OI-20 پاسخ‌داده شد. هیچ انتشار یا push انجام نشد؛ اعلام انتشار قبلی GitHub توسط مالک مبنای تغییر remote قرار نگرفت.

خروجی: جایگزینی صفحه فنی R01 با صفحه فروشگاهی دوزبانه، hero تیره و تصویر اختصاصی، دسته‌های تعاملی، مجموعه مفهومی، جست‌وجو/فیلتر و حالت خالی، dialog جزئیات با focus/Escape، منوی موبایل، روایت تصویری و footer. بدون fake price، موجودی، نظر یا مشخصات فنی؛ preview بودن مجموعه و نبود فروش در صفحه روشن است. صفحه کامل دیتابیس محصول در R05 باقی است.

Vazirmatn 5.3.0 از npm رسمی نصب و lock شد؛ import در globals.css و وزن‌های 400/500/600/700، خانواده فارسی در BUSINESS_CONFIG و توکن تولیدی. آزمون font load/check واقعی پاس شد. مجوز رسمی بسته در public/fonts/vazirmatn-OFL.txt کپی شد؛ وابستگی runtime به CDN ندارد.

از مهارت cinematic-product-site برای جهت تصویری و imagegen برای سه تصویر مفهومی استفاده شد. promptهای کامل در R02_ASSETS؛ اصل PNGها در assets/r02-source و نسخه‌های WebP محلی در public/images/collection. فایل hero جدا از thumbnail است. لوگو/هندسه و رنگ‌های اصلی تغییر نکردند. حرکت با CSS، IntersectionObserver و pointer/scroll محدود انجام می‌شود؛ reduced-motion مسیر ثابت دارد و کتابخانه انیمیشن اضافه نشده است.

شواهد نهایی:

- `pnpm check`: PASS؛ config/env، ۸۵ پیام هر زبان و ICU، Oxlint، TS7، ۱۶ unit test و Prettier.
- `PLAYWRIGHT_CHANNEL=msedge pnpm test:e2e:dev --workers=2`: ۱۴/۱۴ PASS روی dev مستقل 3100.
- `pnpm build`: PASS با Next 16.4.3/Turbopack، بررسی TypeScript فعال.
- `PLAYWRIGHT_CHANNEL=msedge pnpm test:e2e --workers=2`: ۱۴/۱۴ PASS روی production مستقل 3200.
- تست‌های جدید: بارگذاری تصویر و Vazirmatn، search/filter و حالت خالی، modal keyboard/focus، منوی موبایل، عرض‌های ۳۲۰/۳۶۰/۳۹۰/۱۲۸۰، تم‌ها و reduced motion. regression خطای script و locale navigation همچنان پاس است.
- axe 4.14.0 خانه fa/en را در light/dark و dialog باز با tags استاندارد AA تا WCAG2.2 بدون violation گزارش کرد. شماره‌های تزئینی دسته‌ها contrast پایین داشتند و با اصلاح opacity پاس شدند؛ rule غیرفعال یا exclude نشد.
- تست skip-link در cold load پیش از hydration ورودی می‌فرستاد؛ با انتظار روی aria-pressed واقعی کنترل theme، بعد از hydration سه بار پیاپی و سپس suite کامل پاس شد؛ sleep دلخواه یا حذف assertion انجام نشد.
- تصاویر واقعی preview در output/r02 شامل desktop1280 و mobile390، fa/en و light/dark ذخیره‌اند و gitignored هستند. نمای فارسی روشن desktop، فارسی تیره mobile و انگلیسی تیره desktop و crop نهایی hero بصری دیده شدند. همه عرض‌ها از نظر overflow نیز تست شده‌اند.

محدودیت: تست خودکار AA گواهی انطباق کامل نیست؛ screen-reader دستی، همه مرورگرها و field CWV هنوز بررسی نشده‌اند. checkout، auth اجرایی، search دیتابیس و محصول واقعی در این مرحله نیستند. طرح هنوز تأیید ظاهری مالک ندارد؛ R02 به‌دروغ DONE نشده است. سرورهای آزمون متعلق به Playwright خاتمه یافتند؛ dev شخصی مالک دست‌کاری نشد.


## بازنگری R02 — شواهد نهایی

- pnpm check: config/env، ۹۷ پیام هر زبان و ICU، Oxlint، typecheck، ۱۶ تست واحد و قالب‌بندی بررسی می‌شوند.
- test:e2e:dev --workers=2: ۱۹/۱۹ PASS روی dev مستقل 3100 با Edge.
- pnpm build: PASS با Next 16.4.3، بررسی TypeScript فعال.
- test:e2e --workers=2: ۱۹/۱۹ PASS روی production مستقل 3200 با Edge.
- صفحات مستقل در fa/en، حفظ مسیر محصول و query دسته با تغییر زبان، منوی پرچمی و Escape، تم روشن/تاریک/خودکار، عرض حداکثر ۱۱۲۰ و سرمه‌ای واقعی بررسی شدند.
- اسکرول رفت‌وبرگشت GSAP و cleanup پس از reduced-motion پاس شدند. console.error در ناوبری و صفحات بررسی شده و هیچ assertion خطا خاموش نشده است.
- axe روی خانه، dialog و مسیرهای مجموعه/دسته‌ها/درباره/هدفون در هر دو زبان و تم، violation تحت قواعد AA تا WCAG2.2 گزارش نکرد؛ این گواهی کامل انطباق نیست.
- صفحه محصول ناشناخته HTTP 404 دارد؛ status پیش از streaming در proxy تعیین می‌شود. dynamicParams به‌تنهایی در dev برای این وضعیت کافی نبود.
- اجرای زودهنگام GSAP در shell مشترک باعث hydration mismatch می‌شد؛ با marker و scope داخل main و شروع پس از hydration صفحه اصلاح شد. screenshot نیز پس از readiness و با caret اولیه گرفته می‌شود تا ابزار تست پیش از hydration استایل وارد نکند.
- previewها در output/r02-v2 ذخیره‌اند؛ هیروی دسکتاپ روشن، موبایل تیره و صفحه محصول فارسی بصری بررسی شدند. overflow در عرض‌های ۳۲۰/۳۶۰/۳۹۰/۱۲۸۰ تست شده است.

R02 همچنان REVIEW است؛ محصول‌ها مفهومی‌اند و قابلیت فروش واقعی اضافه نشده. سرور شخصی 3000 و GitHub دست‌کاری نشدند.


## QA اصلاح کانتینر و کنترل ظاهر

- کانتینر در عرض‌های ۳۲۰، ۳۹۰، ۱۲۸۰، ۱۴۴۰ و ۱۹۲۰ دقیقاً ۹۰٪ اندازه‌گیری شد؛ overflow افقی ندارد.
- تم اولیه با تغییر prefers-color-scheme سیستم عوض می‌شود؛ گزینه خودکار نمایش داده نمی‌شود و toggle بعد از انتخاب صریح ترجیح کاربر را ذخیره می‌کند. همگام‌سازی تم بین تب‌ها و سناریوی storage مسدود پاس شدند.
- هر چهار پالت در light/dark با axe و قواعد AA تا WCAG2.2 بدون violation بودند؛ انتخاب پالت پس از reload حفظ شد و Escape/focus منو بررسی شد. هیچ قانون دسترس‌پذیری یا assertion کنسول حذف نشد.
- pnpm check: ۱۰۲ پیام هر زبان، lint، typecheck، ۱۶ تست واحد و قالب‌بندی پاس. pnpm build پاس.
- suite مرورگر با Edge: ۲۰/۲۰ dev روی 3100 و ۲۰/۲۰ production روی 3200 پاس.
- اسکرین‌شات‌های output/r02-v3: دسکتاپ رز تاریک و موبایل رز روشن بصری دیده شدند. خروجی‌ها محلی و gitignored هستند.

این شواهد جای اعداد تحویل قبلی را برای نسخه جاری می‌گیرند. تأیید ظاهری مالک و ارزیابی میدانی CWV هنوز انجام نشده‌اند.


## QA تیتر، toggle و اسکرول نرم

آیکون‌های ماه/خورشید داخل toggle، جابه‌جایی thumb و transition رنگ تم، کاهش اندازه تیتر و SignatureHeading مشترک پیاده شدند. Lenis 1.3.27 به GSAP ticker وصل است و cleanup در navigation و reduced-motion بررسی می‌شود. محتوای SSR و شکل پیوسته حروف فارسی حفظ است.

تست تازه signature-motion اسکرول wheel رفت‌وبرگشت، فعال/پاک شدن Lenis، آیکون‌های داخل track، transition و حذف آن در reduced-motion، اندازه h1 و تیتر انگلیسی را بررسی می‌کند. regression منوی موبایل بعد از اصلاح لایه dropdown و hit area سوئیچ پاس شد. هیچ force click یا حذف assertion انجام نشد.

آخرین suite dev: ۲۱/۲۱ PASS روی Edge و پورت 3100. pnpm check شامل ۱۶ unit، typecheck، lint و i18n پاس است. تصاویر دسکتاپ روشن و موبایل تاریک در output/r02-v4 ذخیره و بصری بررسی شدند؛ این فایل‌ها gitignored هستند. pnpm build با typecheck فعال PASS و suite production روی Edge/3200 نیز ۲۱/۲۱ PASS شد. طراحی همچنان REVIEW است.


## بازبینی مهارت‌ها — ۲۰۲۶/۱۰/۳۱

UI/موشن با حفظ هویت و عرض ۹۰٪ اصلاح شد؛ شرح کامل در [UI_REVIEW.md](./UI_REVIEW.md). build و check پاس؛ ۱۶ unit، suite production با ۲۳ تست و regressionهای dev پاس شدند. پس از اصلاح نهایی منوی زبان، دو تست polish در هر دو حالت دوباره پاس شدند. snapshotهای before/after از production در ۱۴۴۰/۷۶۸/۳۹۰ ثبت و بررسی شدند. inspector با سه استثنای مستند برای منوی واقعی/کالای عکس‌دار/border مورد درخواست مالک: ۰ FAIL و ۴ WARN قابل دفاع. source-lint سلیقه‌ای مهارت هنوز برای CSS قدیمی و قراردادهای حفظ‌شده finding دارد؛ نتیجه کامل در گزارش موجود است.

معیارهای تازه: متن تبلت خارج از محدوده عکس، یک CTA در هیرو، aria-current صحیح در صفحات مستقل و محصولات، و dropdown زبان داخل قاب موبایل RTL/LTR. خطای React یا assertion با force click/exclude مخفی نشد. R02 همچنان REVIEW است؛ gate خودکار معادل تأیید ظاهر مالک، screen-reader یا CWV میدانی نیست.


پذیرش نهایی ۲۰۲۶/۱۰/۳۱: مالک نسخه بازبینی‌شده را تأیید کرد. R02 اکنون DONE است و وضعیت REVIEW بالاتر مربوط به پیش از پذیرش است. commit/push همین خروجی مجاز شد؛ شروع R03 نیز مجاز است.


## پذیرش/انتشار R02 و اجرای R03 — ۲۰۲۶/۱۰/۳۱

مالک R02 را پذیرفت و push را صریحاً خواست. commit 1767a14 با عنوان feat(storefront): complete approved R02 bilingual design and motion روی origin/main در https://github.com/merahimi2002/digishop push شد؛ fetch پیش از آن اختلاف ۰/۰ داشت و force push انجام نشد. R02 DONE است.

R03 طبق مجوز مالک اجرا شد. Prisma/Client/Adapter همگی stable 7.10.1 هستند؛ latest=8.0.0-rc.29 عمداً انتخاب نشد. pg و types نسخه 8.23.1، PostgreSQL واقعی 18.6. native Prisma scripts با allowBuilds مشخص فعال شدند؛ هیچ security check، typecheck یا peer conflict مخفی نشد. Node 26 و TS7 حفظ و واقعاً بررسی شدند.

Docker/psql سراسری موجود نبود؛ EDB پاسخ 403 منطقه‌ای داد. payload بومی stable با transport/npm و integrity SHA-512 در .tools نصب شد، بدون helper beta در dependency برنامه یا سرویس ویندوز. cluster فقط لوپ‌بک 55432، database local/test/shadow مجزا و نقش admin bootstrap/owner/app جدا. credentialهای تصادفی در env و tools gitignored باقی‌اند؛ app مجوز DDL و خواندن تاریخچه migration ندارد.

خروجی: ۴۱ مدل، Prisma config و client سروری lazy، دو migration immutable تاریخچه‌دار، قیدهای SQL/trigger/index، seed صریح سه کالای DRAFT بدون حساب کاربری، primitive داخلی reserve/release، Compose و CI آماده. DATABASE/ENVIRONMENT/DEVELOPMENT/ARCHITECTURE/AUTH/SECURITY/OPERATIONS/TECH_STACK/TESTING/README و ROADMAP همگام شدند.

شواهد:

- schema format/validate و generate: PASS.
- migration deploy و status برای local/test: PASS، schema up-to-date.
- migrate diff از تاریخچه به DB با shadow مستقل: No difference detected.
- seed محلی دو بار: PASS؛ ۳ Product/Variant آزمایشی، بدون کاربر و بدون publish/reset موجودی.
- pnpm check: PASS؛ env، ۱۰۲ پیام/ICU در هر زبان، Oxlint، tsc7، ۱۸ unit و Prettier.
- test:db: ۲۰/۲۰ PASS روی PostgreSQL واقعی، نه mock/SQLite؛ شامل FK/unique/check، canonical combination در commit، نوع/scope ویژگی، hash/identity، BigInt و overflow، snapshot، append-only، idempotency و rollback.
- ۲۰ درخواست رزرو روی stock=3: دقیقاً ۳ موفق؛ ۱۰ release رقابتی یک رزرو: دقیقاً یک تغییر.
- SQL plan با ۲۰۰۰ ترجمه: index locale/slug انتخاب شد؛ output/r03/query-plan.json بدون خاموش کردن seqscan.
- دیتابیس کاملاً خالی با نام تصادفی *_test در cluster محلی ساخته شد؛ هر دو migration و seed/۲۰ تست پاس شدند؛ فقط همان دیتابیس موقت پس از disconnect حذف شد. local و test اصلی حفظ شدند.
- pnpm build و suite مرورگر production: PASS، ۲۳/۲۳؛ خطای Theme/locale/UI برنگشت. تغییرات پس از آن مربوط به ابزار DB/env/docs و تست‌های داده بوده‌اند.

R03 DONE، R04 READY. account schema به معنی auth واقعی یا Better Auth adapter تأییدشده نیست؛ Verification hash و role mapping در R04 باید هماهنگ شوند. Primitive انبار مجوز/quote/binding cart-order ندارد و checkout واقعی در R06/R07 است. backup/restore تولید، PostgreSQL مدیریت‌شده، Docker محلی و اجرای ابری workflow جدید هنوز تأیید نشده‌اند. تغییرات R03 فعلاً در workspace هستند؛ push انجام‌شده مربوط به R02 تأییدشده بود.
