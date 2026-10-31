# دیجی‌شاپ — Digishop

فروشگاه فیزیکی تک‌فروشنده برای ایران با مبنای کالای کامپیوتری؛ فارسی/RTL و انگلیسی/LTR از ابتدا، طراحی مدرن و مینیمال با glass کنترل‌شده و دستیار AI برای مشتری و مدیر.

**وضعیت: R01 تا R03 تکمیل؛ R04 در حال اجراست.** دیتابیس، ورود ایمیل/رمز، تأیید، بازیابی و حساب دو‌زبانه محلی ساخته و تست شده‌اند. اتصال ایمیل واقعی باقی است؛ محصول تجاری، پرداخت و AI هنوز ساخته نشده‌اند. شواهد در EXECUTION و وضعیت taskها در ROADMAP ثبت‌اند.

## راهنمای مستندات

| فایل | مسئولیت |
| --- | --- |
| [AGENTS.md](./AGENTS.md) | دستورالعمل دستیار توسعه |
| [BUSINESS_CONFIG.md](./BUSINESS_CONFIG.md) | تنها مرجع مقادیر برند و تنظیمات عمومی |
| [OWNER_INPUT.md](./OWNER_INPUT.md) | وضعیت سؤال‌ها و اطلاعات لازم مالک |
| [TECH_STACK.md](./TECH_STACK.md) | پشته و تصمیم‌های باز |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | مرز ماژول، کش، ترجمه و AI |
| [API.md](./API.md) | قرارداد درخواست، پاسخ و خطا |
| [API_ENDPOINT.md](./API_ENDPOINT.md) | مسیرهای پیشنهادی و دسترسی |
| [AUTH.md](./AUTH.md) | ورود، session، نقش و OTP آینده |
| [BUSINESS_RULES.md](./BUSINESS_RULES.md) | قواعد قیمت، موجودی، پرداخت و حالت دامنه |
| [DATABASE.md](./DATABASE.md) | مدل، constraints و migration |
| [UI.md](./UI.md) | طراحی، تم و حالت‌های UX |
| [SEO.md](./SEO.md) | ایندکس و SEO چندزبانه |
| [SECURITY.md](./SECURITY.md) | کنترل‌های امنیتی |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | تهدید و آزمون کنترل |
| [PRIVACY.md](./PRIVACY.md) | داده شخصی و retention |
| [TESTING.md](./TESTING.md) | راهبرد و سناریوی آزمون |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | متغیرهای محیطی و secrets |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | توسعه محلی و فرمان‌های پیشنهادی |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | staging، انتشار و rollback |
| [OPERATIONS.md](./OPERATIONS.md) | پایش، بکاپ و رخداد |
| [EXECUTION.md](./EXECUTION.md) | کار فعال، evidence و تصمیم‌ها |
| [ROADMAP.md](./ROADMAP.md) | مراحل صفر تا صد و state هر task |
| [docs/PRODUCT.md](./PRODUCT.md) | دامنه قابلیت‌ها |
| [QUALITY.md](./QUALITY.md) | بودجه کیفیت، WCAG و شروط پذیرش |

## قرارداد مرجع

ابتدا BUSINESS_CONFIG، ROADMAP و EXECUTION را بخوانید؛ سپس سند تخصصی همان بخش. مقادیر تجاری فقط در BUSINESS_CONFIG؛ سؤال‌ها در OWNER_INPUT و secrets در محیط امن. generator با `pnpm config:generate` و هنگام dev/build اجرا می‌شود. تغییر برند نمایشی جایگزین انتقال دامنه، حساب درگاه و secrets نیست. راه‌اندازی در DEVELOPMENT شرح داده شده است.

ROADMAP مرجع وضعیت task و EXECUTION مرجع شواهد و تصمیم‌های اجراست؛ در پایان هر مرحله همگام شوند. شرح جزئی هر حوزه در سند تخصصی آن نگهداری شود؛ از ایجاد نسخه موازی همان قرارداد جلوگیری شود. PRODUCT و QUALITY دامنه و معیار کلی را نگه می‌دارند. تصمیم جدید مالک بر پیشنهادهای قدیمی اولویت دارد.



## پیش‌نمایش فروشگاه

طراحی لوکس و خلوت با Vazirmatn، تصاویر مفهومی اختصاصی، جست‌وجو/فیلتر و dialog محصول آماده است. اطلاعات فونت در [FONTS.md](./FONTS.md) و منابع و prompt تصاویر در [R02_ASSETS.md](./R02_ASSETS.md). خروجی‌های مرورگر در output/r02 محلی و gitignored هستند. تغییرات این مرحله هنوز push نشده‌اند؛ انتشار قبلی مالک تغییری نکرده است.




## بازنگری چندصفحه‌ای

مسیرهای /fa/collection، /fa/categories، /fa/about و /fa/products/headphones (و معادل /en) اجرایی‌اند. کانتینر ۹۰٪، منوی زبان پرچمی، toggle روشن/تاریک با پیش‌فرض سیستم و GSAP/ScrollTrigger اضافه شده‌اند. مسیرهای keyboard و mouse نیز صفحه محصول دارند. همه محصولات هنوز مفهومی‌اند. پیش‌نمایش‌های تازه در output/r02-v2 محلی و gitignored ذخیره می‌شوند.


گزارش بازبینی طراحی و انیمیشن با مهارت‌های نصب‌شده: [UI_REVIEW.md](./UI_REVIEW.md).


## داده R03

PostgreSQL 18.6 و Prisma 7.10.1، ۴۱ مدل، دو migration و seed صریح draft آماده‌اند. شروع از [DATABASE.md](./DATABASE.md)؛ فرمان test:db تست‌های واقعی constraint/رقابت/permission/query-plan را روی دیتابیس جدا اجرا می‌کند. public UI هنوز همان پیش‌نمایش R02 است؛ اتصال کاتالوگ تجاری و auth در مراحل بعدند. clone تازه با build/typecheck client را تولید می‌کند؛ فایل‌های env، باینری و داده محلی commit نمی‌شوند.
