# معماری فنی

وضعیت: پایه Next.js، i18n، theme، Query و config در R01 پیاده‌سازی شده؛ ماژول‌های تجاری هنوز طراحی‌اند. فهرست endpointها در [API_ENDPOINT.md](./API_ENDPOINT.md)، داده در [DATABASE.md](./DATABASE.md) و شواهد در [EXECUTION.md](./EXECUTION.md) نگهداری می‌شود.

## پشته و مرزبندی

| بخش | تصمیم |
| --- | --- |
| اپلیکیشن | Next.js App Router؛ فرانت و بک‌اند یکپارچه و ماژولار |
| زبان | TypeScript strict |
| داده | PostgreSQL + Prisma و migration نسخه‌بندی‌شده |
| UI | Tailwind CSS + shadcn/ui + design tokens |
| ترجمه | next-intl، زبان‌های اولیه fa و en |
| داده کلاینت | @tanstack/react-query |
| فرم و validation | React Hook Form + Zod |
| مدیریت وضعیت | React و URL؛ Zustand فقط با نیاز مشخص |
| ابزار | pnpm، Oxlint، Prettier؛ دلیل تغییر lint در TECH_STACK |
| آزمون | Vitest برای منطق و Playwright برای جریان‌های مرورگر |
| فایل | object storage سازگار با S3؛ provider بعداً انتخاب می‌شود |
| احراز هویت | Better Auth انتخاب شده؛ نصب و اتصال اجرایی در R04 |

نسخه‌های دقیق هنگام اجرا از مستندات رسمی بررسی و با lockfile تثبیت می‌شوند. Redis، موتور جست‌وجوی مستقل و زیرساخت برداری صرفاً با نیاز اندازه‌گیری‌شده اضافه می‌شوند. اجرای job بادوام برای کارهای طولانی باید پیش از فعال شدن تولید گروهی AI آماده باشد؛ ابزار آن به محیط میزبانی وابسته است.

## ساختار پیشنهادی

```text
src/
  app/[locale]/             # صفحات فروشگاه، حساب و پنل
  app/api/                  # callback پرداخت، webhook و endpointهای لازم
  components/ui/            # اجزای پایه قابل شخصی‌سازی
  components/storefront/
  components/admin/
  features/                 # catalog, cart, checkout, orders, auth, ai
  server/services/          # قوانین تجاری مشترک
  server/repositories/      # دسترسی داده
  server/auth/              # session و authorization
  server/ai/                # provider adapter، ابزارها و policy
  i18n/                     # routing و تنظیم locale
  config/                   # تنظیمات type-safe تولیدشده از BUSINESS_CONFIG.md
  lib/                      # ابزارهای عمومی کوچک
messages/fa.json
messages/en.json
prisma/
scripts/                    # تولید config و بررسی ترجمه‌ها
tests/
```

نام پوشه‌ها پیشنهاد است؛ مرز مسئولیت‌ها باید حفظ شود. فایل‌های server-only صریحاً از ورود به کلاینت محافظت می‌شوند.

## خواندن، نوشتن و کش

- Server Components برای محتوای اولیه و قابل ایندکس؛ Server Actions برای mutation داخلی؛ Route Handlers برای Queryهای کلاینت، callbackها و یکپارچه‌سازی بیرونی.
- همه ورودی‌ها، session و permission در نقطه ورود بررسی و قواعد مجدداً در سرویس اعمال شوند.
- TanStack Query برای فیلترهای تعاملی، پنل، پیگیری وضعیت و optimistic update کم‌ریسک. Query key شامل locale و پارامترهای مؤثر؛ داده خصوصی از داده عمومی جدا.
- در SSR، QueryClient به‌ازای درخواست ساخته و در صورت نیاز hydrate می‌شود؛ هنگام خروج یا تغییر حساب کش خصوصی پاک می‌شود.
- Server cache و client cache دو مسئولیت متفاوت دارند؛ پس از تغییر محصول، invalidation هر دو طبق قرارداد همان feature انجام شود.
- سفارش، session و اطلاعات خصوصی وارد کش عمومی نشوند. checkout قیمت، تخفیف و موجودی را تازه از سرور می‌خواند.
- وضعیت فیلتر، مرتب‌سازی و صفحه در URL برای اشتراک‌گذاری و navigation حفظ شود؛ درخواست‌های غیرضروری debounce/cancel شوند.

## چندزبانگی و جهت

- مسیرها با پیشوند صریح `/fa` و `/en`؛ `/` به زبان پیش‌فرض یا انتخاب ذخیره‌شده هدایت شود. URL صریح زبان با تشخیص مرورگر بازنویسی نشود.
- localeها از تنظیمات مرکزی به registry next-intl منتقل شوند؛ locale نامعتبر 404 بدهد.
- `html.lang` و `html.dir` در هر مسیر صحیح؛ از CSS logical properties استفاده شود.
- پیام‌ها با ICU برای plural و interpolation؛ جمله‌ها با چسباندن ترجمه چند کلمه ساخته نشوند.
- قالب‌بندی عدد، مبلغ و تاریخ متمرکز؛ تاریخ ذخیره‌شده UTC، نمایش طبق locale و timezone کسب‌وکار. تقویم نمایش در طراحی نهایی مشخص شود.
- slugs محلی با شناسه پایدار محصول؛ تغییر slug با redirect پایدار. locale-switcher از رابطه ترجمه‌ها استفاده کند.
- ترجمه کاتالوگ در جداول مستقل؛ پیام‌های UI در فایل زبان. fallback انگلیسی نباید ناخواسته به‌عنوان صفحه ترجمه‌شده ایندکس شود.
- هر زبان فقط در صورت تکمیل محتوای لازم در sitemap و hreflang وارد شود؛ زبان جدید نیازمند ترجمه و QA واقعی است.
- RTL: آیکون‌های جهتی مانند back/next آینه شوند؛ لوگو، تصویر محصول و آیکون غیرجهتی آینه نشوند.

## مدل داده پایه

| حوزه | موجودیت‌ها و قواعد |
| --- | --- |
| هویت | User، Session، Address، Role/Permission، رکورد verification دارای انقضا |
| کاتالوگ | Product، ProductTranslation، Category و ترجمه، ProductBrand، Media و متن جایگزین محلی |
| ویژگی | AttributeDefinition با نوع، واحد، دامنه دسته، قابلیت فیلتر و ترجمه؛ AttributeValue اعتبارسنجی‌شده |
| تنوع | Variant با SKU یکتا، ترکیب option یکتا، قیمت، وزن و موجودی؛ محصول ساده یک variant پیش‌فرض دارد |
| انبار | Inventory، StockMovement، Reservation با انقضا و جلوگیری از oversell |
| خرید | Cart، CartItem، Order، OrderItem snapshot، OrderAddress snapshot |
| پرداخت | PaymentAttempt، PaymentEvent، کلید idempotency و شناسه یکتای تراکنش |
| ارسال | Shipment، روش ارسال، هزینه و tracking؛ وابستگی ارسال به وضعیت سفارش مشخص |
| تخفیف | Coupon، قواعد اعتبار، Usage و محدودیت مصرف اتمیک |
| AI و نظارت | AiConversation، ToolExecution، Usage، AuditLog؛ نگهداری و حذف طبق سیاست داده |

ویژگی‌های قابل فیلتر و تنوع‌ها رابطه‌ای و دارای نوع باشند؛ JSON فقط برای metadata منعطف و محدود، نه جایگزین تمام مدل محصول. نام تجاری فروشگاه با برند سازنده کالا یکی نیست.

## پول و گردش سفارش

- مبلغ به‌صورت عدد صحیح ریال با نوع پایگاه داده مناسب؛ BigInt در مرز JSON به شکل کنترل‌شده serialize شود. تبدیل تومان/ریال متمرکز و تست‌شده است.
- OrderItem نام، SKU، ویژگی انتخابی، واحد پول، قیمت، تخفیف و مالیات زمان خرید را نگه می‌دارد؛ آدرس سفارش نیز snapshot است.
- قیمت نهایی و هزینه ارسال در سرور؛ تغییر قیمت یا موجودی پیش از پرداخت به کاربر اعلام شود.
- موجودی در تراکنش اتمیک رزرو شود؛ رزرو منقضی آزاد شود. زمان رزرو در تنظیمات کسب‌وکار مشخص می‌شود.
- ایجاد پرداخت، تأیید پرداخت، مصرف کوپن و ثبت سفارش در برابر تکرار درخواست ایمن باشند؛ صرف callback مرورگر اثبات پرداخت نیست.
- تماس شبکه با درگاه خارج از تراکنش طولانی دیتابیس؛ نتیجه با transitionهای معتبر و شناسه یکتا ثبت شود.
- حالت سفارش از حالت پرداخت و ارسال جدا باشد. حالت‌های نمونه پرداخت: pending، verified، failed، expired، refunded؛ transition نامعتبر رد شود.
- callback تکراری یا دیررس نباید باعث دوبار کم شدن موجودی شود. پرداخت موفق پس از انقضای رزرو وارد مسیر reconciliation و رسیدگی مشخص می‌شود.
- ارسال و اعلان پس از commit با outbox/job و retry قابل کنترل؛ بازپرداخت به قابلیت و قرارداد درگاه وابسته است.

## احراز هویت

ورود اولیه ایمیل و رمز اختصاصی هر حساب است، نه رمز مشترک و نه الزاماً Google OAuth. هش رمز با الگوریتم استاندارد کتابخانه معتبر؛ session در کوکی HttpOnly، Secure در تولید و SameSite مناسب؛ CSRF و session revocation پوشش داده شوند.

ورود/ثبت‌نام/بازیابی دارای rate limit و پاسخ بدون افشای وجود حساب باشند. ایمیل تأییدنشده مجوز حساب تأییدشده ندارد. بازیابی رمز به سرویس ایمیل واقعی نیاز دارد؛ پیش از اتصال، قابلیت جعلی نمایش داده نشود.

OTP بعداً با شماره نرمال‌شده، کد دارای انقضا، سقف تلاش و فاصله ارسال فعال می‌شود. اتصال شماره به حساب موجود پس از احراز مالکیت و با جلوگیری از ادغام خودکار ناامن انجام می‌شود. حساب مدیر از مسیر امن bootstrap شده و ایجاد حساب عادی هرگز نقش مدیر نمی‌دهد.

## AI

- کلید provider فقط سمت سرور؛ تنظیم از متغیر محیطی یا پنل مدیریت با ذخیره رمزنگاری‌شده و کلید اصلی جدا از دیتابیس. کلید ثبت‌شده دوباره به مرورگر برگردانده نمی‌شود.
- adapter مشترک برای قابلیت‌های مدل؛ پشتیبانی هر provider از tool calling، streaming و خروجی ساختاریافته بررسی شود. تعویض provider به معنی برابری همه قابلیت‌ها نیست.
- ابزارهای read/write با schema، authorization، timeout، محدودیت دفعات و ثبت audit؛ بدون SQL آزاد، shell یا دسترسی شبکه دلخواه مدل.
- داده محصول، فایل و ورودی مشتری untrusted هستند؛ دستورهای داخل آن‌ها حق تغییر policy یا سطح دسترسی ندارند.
- query سفارش به session و مالکیت سفارش متصل است؛ شماره سفارش به‌تنهایی مجوز نیست.
- پاسخ محصول و سیاست فروش از داده واقعی؛ در نبود اطلاعات، عدم قطعیت روشن باشد. قیمت و موجودی لحظه اجرا دوباره بررسی شوند.
- تغییر حساس: پیش‌نمایش دقیق، تأیید صریح مدیر متصل به payload و انقضا، سپس اجرا با بررسی مجدد مجوز و شرایط.
- محدودیت token، نرخ، هم‌زمانی و سقف بودجه؛ retry محدود، fallback قابل فهم و قطع سرویس بدون اختلال خرید.
- ارسال حداقل داده شخصی به provider؛ عدم ثبت secrets و پرداخت در prompt/log؛ سیاست نگهداری مکالمه مشخص شود.
- تولید گروهی در job بادوام با progress، cancel و idempotency؛ خروجی محتوا پیش‌نویس است.

## تنظیمات و عملیات

محیط‌های local، preview/staging و production جدا؛ دیتابیس و کلیدهای مستقل. migration تولید با برنامه انتشار، بکاپ و مسیر بازیابی اجرا شود؛ از schema push مخرب در تولید استفاده نشود. log ساختاریافته با correlation ID و حذف داده حساس، پایش خطا، سلامت سرویس و هشدار پرداخت/موجودی ضروری است.



## مسیرهای پیش‌نمایش چندصفحه‌ای R02

همه مسیرها زیر /fa و /en هستند؛ StoreShell سروری header/footer مشترک را نگه می‌دارد و هر صفحه main و metadata خود را دارد.

| مسیر | کارکرد |
| --- | --- |
| / | خانه و هیرو |
| /collection?category=audio | مجموعه، جست‌وجو و فیلتر دسته |
| /categories | دسته‌ها با لینک به مجموعه |
| /about | روایت برند در پیش‌نمایش |
| /products/headphones | صفحه هدفون مفهومی |
| /products/keyboard | صفحه کیبورد مفهومی |
| /products/mouse | صفحه ماوس مفهومی |

concept-products.ts مرجع موقت سه محصول مفهومی است؛ دیتابیس یا قیمت/موجودی واقعی ندارد. dynamicParams=false و generateStaticParams مسیرهای شناخته‌شده را تعریف می‌کنند. proxy نیز محصول ناشناخته را پیش از streaming با status 404 به صفحه ناموجود هدایت داخلی می‌کند تا soft-404 رخ ندهد. در R05، قرارداد catalog واقعی باید جای lookup ثابت در صفحه و proxy را بگیرد؛ این محدودیت سه‌محصولی دائمی نیست.

StorefrontMotion در انتهای هر main قرار دارد و بعد از hydration scope همان صفحه را با GSAP تغییر می‌دهد؛ layout مشترک انیمیشن محتوای هنوز hydrate نشده را اجرا نمی‌کند.


## لایه داده اجرایی R03

prisma/schema.prisma و migrations مرجع فیزیکی داده‌اند؛ factory اتصال برای CLI/integration و client.ts با server-only و getDatabase lazy برای کد سرور است. QueryClient کلاینت هیچ connection string دریافت نمی‌کند. pool هر process حداکثر ۱۰ اتصال دارد؛ ظرفیت کل استقرار باید با تعداد instanceها سنجیده شود.

inventory.ts primitive داخلی UPDATE شرطی و transaction برای reserve/release است؛ caller/cart/order authorization و quote در R06/R07 اضافه می‌شوند. UI فعلاً concept-products را می‌خواند؛ اتصال آن به DB در R05 و بعد از R04 انجام می‌شود. schema auth وجود دارد ولی Better Auth/ورود هنوز فعال نیستند. تنظیمات، محدودیت‌های SQL و مسیر migration در DATABASE ثبت‌اند.

## پیشرفت R04 — ۲۰۲۶/۱۰/۳۱

src/server/auth شامل factory مستقل و قابل تست، mail، policy، HTTP allowlist و session سروری است؛ فایل‌های index/routes/session دارای مرز server-only هستند. Route Handlerهای Next نازک‌اند. فرم‌ها Zod مشترک، React Hook Form و TanStack Query با private key دارند؛ خروج و تغییر هویت cache خصوصی را پاک می‌کند. بررسی اولیه حساب و admin روی سرور و بررسی هر API روی سرور انجام می‌شود؛ UI مرز امنیتی نیست.

## R05 — ساختار کاتالوگ، ۲۰۲۶/۱۰/۳۱

src/server/catalog/service.ts تراکنش‌های دسته/برند/ویژگی، ترجمه، category scope و choice را نگه می‌دارد. HTTP adapter مستقل، قابل تست با PostgreSQL واقعی و دارای کنترل دسترسی است؛ Route Handler نازک است. mutationها advisory transaction lock مشترک دارند تا دو ویرایش parent به‌طور هم‌زمان چرخه نسازند. audit با همان تراکنش ثبت می‌شود و rollback شامل تمام ترجمه‌ها/روابط است. snapshot revision قبل از mutation بررسی می‌شود.


## R05 — محصول و فروشگاه، ۲۰۲۶/۱۱/۰۲

پنل محصول مسیر /[locale]/admin/products و API موجود کاتالوگ با resource=products را استفاده می‌کند. TanStack Query کلید private/products دارد و خروج R04 آن را پاک می‌کند. سرویس products برای نوشتن و storefront برای خواندن عمومی مستقل‌اند. صفحات عمومی با connection() در زمان درخواست از PostgreSQL می‌خوانند؛ کش بین درخواست‌ها یا fallback به داده مفهومی ندارند. cache() در جزئیات فقط تکرار query در همان render/metadata را حذف می‌کند.

خانه بخش کاتالوگ واقعی دارد؛ تصاویر و dialogهای مفهومی با برچسب پیش‌نمایش باقی‌اند و مسیر جزئیاتشان /preview/products/[slug] با noindex است. /collection و /categories از داده منتشرشده می‌خوانند؛ جزئیات draft/archive به notFound می‌رود. تغییر زبان نامک ترجمه متناظر را resolve می‌کند؛ هیچ تبدیل ارز خارجی انجام نمی‌شود.


قرارداد نهایی ۲۰۲۶/۱۱/۰۲: ثبات گزینه‌ها به معنی حفظ محورهای گزینه و کد مقدارهای موجود است. افزودن مقدار جدید به محور موجود و ساخت variant جدید برای آن در پنل/API مجاز است؛ حذف یا تغییر کد موجود و تغییر ترکیب variant ذخیره‌شده مجاز نیست. این قاعده بر عبارت‌های کلی «ساختار ثابت» در شرح اولیه همین مرحله اولویت دارد.
