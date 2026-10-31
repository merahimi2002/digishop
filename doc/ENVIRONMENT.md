# متغیرهای محیطی و secrets

وضعیت: `.env.example` و `.env.test.example` ساخته شدند؛ validation در config سرور Next هنگام اجرا/build و با `pnpm env:check` فعال است. متغیرهای سرویس‌های آینده inventory پیشنهادی‌اند و در R01 استفاده نمی‌شوند. env:check اولویت shell و فایل‌های محلی مطابق NODE_ENV را رعایت می‌کند.

| متغیر پیشنهادی | دامنه | نیاز |
| --- | --- | --- |
| DATABASE_URL | server secret | دیتابیس با حساب حداقل‌دسترسی؛ تولید جدا |
| BETTER_AUTH_SECRET | server secret | حداقل ۳۲ کاراکتر برای Better Auth هنگام AUTH_ENABLED=true |
| APP_ORIGIN | server config عمومی | origin معتبر برای URL و callback؛ با دامنه برند سازگار |
| CONFIG_ENCRYPTION_KEY | server secret | رمزنگاری credentials ذخیره‌شده؛ خارج از دیتابیس |
| EMAIL_API_KEY / EMAIL_FROM | server | پس از انتخاب ایمیل تراکنشی |
| SMS_API_KEY | server secret | فقط هنگام فعال‌سازی OTP |
| PAYMENT_MERCHANT_ID / PAYMENT_SECRET | server secret | مطابق درگاه منتخب |
| STORAGE_ENDPOINT / STORAGE_REGION / STORAGE_BUCKET | server config | object storage |
| STORAGE_ACCESS_KEY / STORAGE_SECRET_KEY | server secret | دسترسی محدود به bucket |
| AI_API_KEY / AI_BASE_URL / AI_MODEL | server | مسیر env به‌عنوان جایگزین ثبت امن در پنل |
| JOB_QUEUE_URL / RATE_LIMIT_STORE_URL | server secret | وابسته به زیرساخت نهایی |
| OBSERVABILITY_DSN | طبق سرویس | انتشار به کلاینت فقط اگر ذاتاً عمومی و مجاز باشد |

مقادیر عمومی هویت و کسب‌وکار در BUSINESS_CONFIG هستند؛ در env تکرار نشوند. APP_ORIGIN تنظیم استقرار است و باید با دامنه ثبت‌شده تطبیق داده شود. پیشوند `NEXT_PUBLIC_` به معنی انتشار در مرورگر است؛ به secrets افزوده نشود.

config در startup/build با schema اعتبارسنجی شود؛ سرویس اختیاری غیرفعال می‌تواند بدون کلید بالا بیاید، ولی feature فعال با کلید ناقص باید خطای روشن بدهد. اولویت پیشنهادی AI: credential ذخیره‌شده و فعال در پنل، سپس env؛ منبع فعال قابل مشاهده ولی مقدار مخفی باشد. انتخاب نهایی در R09 تست شود.

local، test، preview و production credential و database جدا دارند. `.env*` واقعی gitignored؛ فقط نمونه بدون مقدار محرمانه commit شود. secrets در لاگ/اسکرین‌شات/چت/Markdown کپی نشوند. rotation، ابطال و تغییر کلید رمزنگاری باید مسیر مهاجرت امن و بازیابی داشته باشند.


## قرارداد فعال R01

APP_ENV یکی از local/test/preview/production است و با NODE_ENV (حالت اجرای Next) تفاوت دارد. مقدار پیش‌فرض APP_ORIGIN برابر http://localhost:3000 است؛ در APP_ENV=production باید HTTPS باشد. AUTH_ENABLED و AI_ENABLED پیش‌فرض false هستند. ENV schema فقط feature فعال را ملزم به credential می‌کند. فیلتر نام دیتابیس تست یک guard کمکی است، جایگزین جداسازی credential و زیرساخت نیست. در R01 هیچ اتصال دیتابیس انجام نمی‌شود.



## قرارداد فعال R03

DATABASE_URL و DIRECT_DATABASE_URL اکنون استفاده می‌شوند: اولی نقش برنامه و دومی migration owner. SHADOW_DATABASE_URL اختیاری ولی مستقل و disposable است و نباید همان host/path دیتابیس برنامه باشد. هر URL دیتابیس باید postgres/postgresql باشد؛ در APP_ENV=test نام آن باید با _test تمام شود. خطاهای validation فقط نام فیلد/پیام را می‌دهند و URI/رمز را بازتاب نمی‌دهند.

DEMO_SEED_ENABLED پیش‌فرض false است؛ تنها APP_ENV=local/test و مقدار true اجازه seed می‌دهند. seed در build/install خودکار اجرا نمی‌شود. نقش‌ها و passwordهای portable توسط db:setup:local به envهای gitignored نوشته می‌شوند؛ مقادیر fixture در Compose و CI صرفاً توسعه/تست‌اند. UI عمومی همچنان بدون DB بالا می‌آید و getDatabase فقط هنگام عملیات سروری اتصال می‌سازد.

## پیشرفت R04 — ۲۰۲۶/۱۰/۳۱

AUTH_ENABLED=true به DATABASE_URL و BETTER_AUTH_SECRET تصادفی حداقل ۳۲ کاراکتری نیاز دارد. AUTH_EMAIL_TRANSPORT برابر local یا smtp است. SMTP_HOST، SMTP_PORT (پیش‌فرض 587)، SMTP_USER، SMTP_PASSWORD و EMAIL_FROM برای SMTP؛ OWNER_EMAIL فقط برای bootstrap امن سرور است. در preview/production، SMTP احرازشده و origin HTTPS اجباری است. پورت 465 اتصال TLS و سایر پورت‌ها STARTTLS دارند؛ TLS در محیط واقعی الزامی است. .env.example و .env.test.example نمونه بدون credential هستند. local mailbox فقط توسعه/تست و نه ارسال واقعی است.
