# امنیت

وضعیت: الزامات طراحی؛ کنترل‌ها هنوز پیاده‌سازی یا ارزیابی نشده‌اند. مدل تهدید در [THREAT_MODEL.md](./THREAT_MODEL.md) و معیار آزمون در [TESTING.md](./TESTING.md) است.

## کنترل‌های لازم

- validation سرور، query پارامتری/ORM، escape خروجی، sanitize HTML غنی، و منع اجرای محتوای کاربر.
- کنترل session، CSRF، role/permission و ownership در تمام endpointها، Server Actions و ابزارهای AI.
- secure cookies، TLS، CSP و headerهای مناسب؛ استثنای CSP فقط با دلیل و دامنه مشخص سرویس.
- محدودیت نرخ توزیع‌شده در محیط چند instance، اندازه بدنه، upload، timeout و concurrency.
- upload دارای intent کوتاه‌عمر، بررسی نوع واقعی و اندازه، scope bucket، عدم اجرای فایل و سیاست SVG؛ فایل تأییدنشده منتشر نشود.
- جلوگیری از SSRF در AI_BASE_URL، دریافت تصویر یا URL بیرونی: دسترسی مدیر به تنظیم به‌تنهایی کافی نیست؛ مقصد، redirect و شبکه خصوصی/metadata محدود شوند.
- secrets فقط server-side، least privilege، رمزنگاری credentialهای ذخیره‌شده و مسیر rotation با کلید جدا.
- درگاه با verify مستقل، تطابق مبلغ/reference و idempotency؛ callback بدون اعتماد به query مرورگر.
- audit عملیات حساس با actor و payload پالایش‌شده؛ حذف یا تغییر audit توسط مدیر عادی مجاز نباشد.
- dependency/secret scan و تست permission در CI؛ audit خودکار جای review را نمی‌گیرد.

## AI

ورودی مشتری، متن محصول، فایل و خروجی مدل غیرقابل اعتمادند. مدل permission تعیین نمی‌کند؛ ابزار با session واقعی و schema محدود اجرا می‌شود. ابزار SQL/shell آزاد و URL دلخواه وجود ندارد. تأیید مدیر به actor، عملیات، payload، زمان و nonce متصل و یک‌بارمصرف باشد. بودجه و حد مصرف سمت سرور enforce شوند.

## رسیدگی

آسیب‌پذیری با دامنه اثر، روش بازتولید بدون secret و شدت ثبت شود. ضعف بحرانی auth، پرداخت یا نشت اطلاعات پیش از انتشار رفع شود. در حادثه، ابتدا مهار، سپس حفظ evidence پالایش‌شده، rotation/رفع، آزمون مجدد و گزارش رخداد. هیچ تست تهاجمی روی سرویس ثالث بدون مجوز انجام نشود.



## مرز داده در R03

client سروری و lazy، app-role غیرمالک و فاقد CREATE، عدم دسترسی app به _prisma_migrations، owner مجزا، PostgreSQL لوپ‌بک با SCRAM و credential تصادفی محلی بررسی شدند. UUID جای authorization نیست؛ مجوز row/object و rate limit به R04/R05/R07 وابسته‌اند. ledgerهای AuditEvent/InventoryMovement با trigger از UPDATE/DELETE عادی محافظت می‌شوند. Verification فقط hash و guest cart فقط hash ذخیره می‌کند. Error validation شامل URI یا مقدار secret نیست؛ logging خطای DB در endpoint آینده باید همچنان sanitize شود.

تست‌ها روی *_test و نقش‌های جدا اجرا می‌شوند؛ نام DB تنها guard کمکی است. Compose/CI password fixtureهای عمومی توسعه دارند، نه credential واقعی. shadow باید جدا باشد؛ migration/reset تولید بدون backup و برنامه expand/contract مجاز نشده. هیچ policy انتشار واقعی در این مرحله اجرا نشده است.

## پیشرفت R04 — ۲۰۲۶/۱۰/۳۱

R04: allowlist endpoint، Origin دقیق، JSON محدود، password hashing کتابخانه، کوکی HttpOnly/SameSite/Secure HTTPS، session revocation و بررسی نقش تازه اجرایی‌اند. rate limit دیتابیسی ایمیل نرمال‌شده و bucket مشترک مسیر در برابر XFF جعلی تست شده است. identifier توکن هش و هدف‌دار است؛ مصرف اتمیک، انقضا، پاسخ عمومی ایمیل و عدم افشای session token تست شده‌اند. حساب مالک رمز تصادفی محلی، تأیید ایمیل و تغییر رمز اجباری دارد. این شواهد ممیزی امنیت مستقل یا تأیید سرویس SMTP نیستند.
