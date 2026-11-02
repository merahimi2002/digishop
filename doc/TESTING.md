# راهبرد آزمون

وضعیت: Vitest و Playwright نصب شده‌اند؛ تست‌های R01 برای config، env، ترجمه، query isolation و مسیرهای مرورگر فعال‌اند. آزمون‌های مالی/دیتابیس/AI مربوط به مراحل آینده‌اند. معیارهای کلی در [QUALITY.md](./QUALITY.md) است؛ نتیجه واقعی در EXECUTION ثبت می‌شود.

## سطوح

| سطح | ابزار پیشنهادی | پوشش مهم |
| --- | --- | --- |
| static | TypeScript، Oxlint، config/i18n validation | نوع، پیام ناقص و تنظیم نامعتبر |
| unit | Vitest | پول، تخفیف، validation و state transition |
| integration | Vitest با PostgreSQL تست جدا | constraint، تراکنش، رقابت، مالکیت و idempotency |
| contract | schema و تست Route Handler/provider adapter | DTO، خطا و قرارداد callback |
| end-to-end | Playwright | ورود، کاتالوگ، سبد، checkout، پنل در fa/en |
| accessibility | ابزار خودکار مناسب + تست دستی | keyboard، screen reader، contrast و focus |
| performance | Lighthouse آزمایشگاهی + داده میدانی بعداً | مسیرهای اصلی روی build تولید |

## سناریوهای اولویت بالا

### بازگشت خطای ThemeProvider

`tests/e2e/theme-navigation.spec.ts` هم console.error و هم pageerror را ثبت می‌کند؛ تست فقط با crash-free بودن پاس نمی‌شود. سناریوها: fa → en → fa با حفظ تم، روشن/تاریک/سیستم و تغییر واقعی media preference، reload، دو تب و storage مسدود. خطای گزارش‌شده قبل از اصلاح با همین تست در dev بازتولید شد.

`pnpm test:e2e:dev --workers=2` سرور مستقل Next dev/Turbopack را روی 3100 با خروجی `.next-e2e-dev` اجرا می‌کند؛ `pnpm test:e2e` روی سرور production مستقل پورت 3200 اجرا می‌شود. reuseExistingServer خاموش است تا تست به اشتباه به dev شخصی پورت 3000 وصل نشود. CI هر دو suite را اجرا می‌کند؛ اجرای ابری همچنان نیازمند push است. نتیجه محلی: ۸ تست در هر حالت پاس، بدون خطای کنسول در سناریوهای regression.

- تبدیل ریال/تومان، مبلغ بزرگ، گردکردن تخفیف و جمع اجزا با سیاست مصوب.
- دو خرید هم‌زمان آخرین کالا، expiry رزرو هم‌زمان با verify، callback تکراری/دیررس و retry checkout.
- شکست شبکه بعد از پرداخت موفق؛ reconciliation بدون سفارش یا برداشت تکراری.
- مشتری A در برابر اطلاعات B، دسترسی غیرمدیر، session منقضی و CSRF.
- تغییر قیمت/موجودی پس از افزودن به سبد؛ variant نامعتبر یا غیرفعال.
- locale نامعتبر، پیام گمشده، جهت درست، تعویض زبان در محصول و کش جدا.
- AI prompt injection، ابزار غیرمجاز، تأیید منقضی/تغییر payload، افشای داده و اتمام بودجه.
- خروج از حساب و ورود حساب دیگر بدون باقی ماندن داده خصوصی در Query cache.

داده آزمون deterministic و بدون PII واقعی؛ زمان، provider و failure قابل کنترل باشند. mock provider فقط منطق داخلی را ثابت می‌کند؛ اتصال با sandbox واقعی نیز بررسی شود. دیتابیس تست هرگز production نباشد.

در هر تغییر آزمون متناسب اجرا و نتیجه با فرمان، محیط و خلاصه evidence در EXECUTION ثبت شود. تست‌های قرمز به‌خاطر سهولت حذف/skip نشوند. پوشش درصدی به‌تنهایی معیار صحت نیست. تغییر کم‌ریسک متن تست تقلیدی نمی‌خواهد. قبل از انتشار، ماتریس مرورگر/موبایل، هر دو زبان و هر دو تم تکمیل شود.


## پوشش R02

۱۴ تست مرورگر در dev و ۱۴ تست در production پاس شدند. storefront.spec شامل بارگذاری واقعی فونت و تصویر، search/filter/empty state، focus dialog و Escape، منوی موبایل، تم‌ها، بدون overflow در ۳۲۰/۳۶۰/۳۹۰/۱۲۸۰ و reduced-motion است. accessibility.spec با axe، tags مربوط به WCAG A/AA تا 2.2 را روی خانه fa/en در هر دو تم و dialog باز بررسی می‌کند؛ بررسی خودکار گواهی کامل انطباق نیست. تست skip-link اکنون پیش از ارسال Tab منتظر نشانه واقعی hydration-ready می‌ماند تا commit اولیه route با ورودی تست رقابت نکند.



## ماتریس بازنگری چندصفحه‌ای R02

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


## ماتریس R03

test:db در vitest.integration.config.ts از unit جداست؛ قبل از migration، APP_ENV=test، هر دو URL با suffix _test، یک host/database و دو نقش متفاوت را الزام می‌کند. سپس migration و app grants را اجرا می‌کند. ۲۰ تست integration شامل SKU/slug/variant تکراری، deferred combination، FK بین محصولات، نوع/scope ویژگی، حلقه دسته، نرمال‌سازی حساب/hash، مبلغ/تعداد نامعتبر، BigInt بالای MAX_SAFE_INTEGER و overflow، مبلغ و snapshot پرداخت، append-only ledger، idempotency، رقابت ۲۰ رزرو برای ۳ موجودی، آزادسازی فقط یک بار و rollback است. seed دوباره users یا رکورد تکراری نمی‌سازد.

EXPLAIN ANALYZE/BUFFERS روی ۲۰۰۰ ترجمه index locale/slug را بدون خاموش کردن seqscan انتخاب کرد؛ output/r03/query-plan.json gitignored است. داده SQL تست داخل rollback یا fixtureهای *_test می‌ماند. بازسازی کامل از DB خالی موقت نیز جدا بررسی شده است. CI service PostgreSQL 18.6 و test:db اضافه شد؛ اجرای cloud بعدی هنوز تأیید نشده و Docker محلی در دسترس این دستگاه نبود.

unit suite فعلی ۱۸ تست؛ regression مرورگر production ۲۳ تست همچنان پاس است. این شواهد نه تأیید گردش checkout/payment واقعی است و نه benchmark تولید.

## پیشرفت R04 — ۲۰۲۶/۱۰/۳۱

۲۱ unit و ۳۲ integration (۲۰ داده + ۱۲ auth) پاس شدند. ۴ تست auth مرورگر production پورت3400 و همان ۴ تست dev پورت3500 با Edge پاس شدند: ثبت‌نام، ارسال دوباره تأیید، ورود، نام حساب، بازیابی، خروج، cache و مجوز. Axe روی فرم ورود در fa/en، تم روشن/تیره و عرض‌های320/390/768/1280 اجرا شد؛ خطای console/page ثبت‌شده صفر بود. ۲۳ تست پایه storefront production نیز در این تحویل پاس شده‌اند. workflow CI به تست‌های auth مجهز شد ولی اجرای remote این تغییرات هنوز مشاهده نشده است. تست SMTP خارجی انجام نشده.


## R05 — محصول و فروشگاه، ۲۰۲۶/۱۱/۰۲

پوشش جدید tests/unit/products.test.ts، tests/integration/products.test.ts و tests/auth-e2e/products.spec.ts است. واحد: BigInt/اعشار/overflow، نمایش تومان دقیق، ترجمه، ترکیب و انتشار. PostgreSQL: مجوز/origin، draft/publish/archive، دو زبان، ledger/audit، رزرو و stale edit، رقابت دو ویرایش، rollback، هویت variant و DTO عمومی. مرورگر: ساخت دو variant از فرم، انتشار، انتخاب تنوع ناموجود، تغییر زبان با نامک متفاوت، قیمت/موجودی تازه و بایگانی؛ axe و overflow در هر دو جهت/تم و۳ عرض.

suite قدیمی طراحی برای مسیر جدید /preview/products تطبیق یافته است؛ /products دیگر fallback مفهومی ندارد. نتیجه نهایی فرمان‌ها در EXECUTION ثبت می‌شود. آزمون مرورگر و axe جای سخت‌افزار واقعی موبایل، screen reader دستی و CWV میدانی نیستند.
