# فهرست endpointها

جدول اصلی زیر **PLANNED** است؛ مسیرهای اجرایی R04 در بخش انتهای سند آمده‌اند. اختصار: عمومی = بدون ورود، مالک = فقط داده همان حساب، مدیر = permission لازم. همه مسیرها زیر `/api/v1` هستند مگر خلاف آن ذکر شود.

| شناسه | Method / مسیر | دسترسی | ورودی/خروجی و قاعده مهم |
| --- | --- | --- | --- |
| API-01 | GET /products | عمومی | locale، page، sort، filter → فهرست منتشرشده و meta؛ page size محدود |
| API-02 | GET /products/:id | عمومی | locale → جزئیات و variant؛ محصول منتشرنشده 404 |
| API-03 | GET /categories | عمومی | locale → درخت دسته فعال |
| API-04 | GET /search | عمومی | q، locale، page → نتایج؛ rate limit و سیاست noindex |
| API-05 | GET /cart | مالک/مهمان طبق تصمیم | سبد session؛ قیمت نمایشی قابل تغییر است |
| API-06 | POST /cart/items | مالک/مهمان طبق تصمیم | variantId و quantity؛ کنترل variant و حد تعداد |
| API-07 | PATCH /cart/items/:id | مالک/مهمان طبق تصمیم | quantity؛ عدم دسترسی به آیتم دیگران |
| API-08 | DELETE /cart/items/:id | مالک/مهمان طبق تصمیم | حذف idempotent در سبد مجاز |
| API-09 | POST /checkout/quote | مالک/مهمان طبق تصمیم | آدرس، روش ارسال، coupon → قیمت تازه؛ بدون تضمین رزرو |
| API-10 | POST /checkout | طبق سیاست checkout | quote معتبر/ورودی بازبینی‌شده و idempotency → سفارش و پرداخت؛ مبلغ سروری |
| API-11 | GET /orders | مالک | سفارش‌های همان حساب، صفحه‌بندی |
| API-12 | GET /orders/:id | مالک یا مدیر مجاز | snapshot و وضعیت؛ کنترل مالکیت |
| API-13 | GET/POST /payments/:provider/callback | درگاه؛ خارج از session | روش واقعی مطابق provider؛ تأیید server-to-server و deduplication |
| API-14 | GET /addresses | مالک | آدرس‌های همان حساب |
| API-15 | POST /addresses | مالک | آدرس اعتبارسنجی‌شده |
| API-16 | PATCH/DELETE /addresses/:id | مالک | ویرایش/حذف؛ snapshot سفارش تغییر نمی‌کند |
| API-17 | POST /ai/chat | عمومی محدود/کاربر | پیام، conversationId → stream؛ ابزار خصوصی نیازمند ورود |
| API-18 | GET /admin/products | مدیر کاتالوگ | شامل draft؛ کش خصوصی |
| API-19 | POST /admin/products | مدیر کاتالوگ | schema محصول و ترجمه‌ها؛ audit |
| API-20 | PATCH /admin/products/:id | مدیر کاتالوگ | version برای تشخیص ویرایش هم‌زمان |
| API-21 | POST /admin/media/upload-intent | مدیر کاتالوگ | نوع/اندازه → مجوز کوتاه‌عمر upload؛ finalize و بررسی فایل لازم |
| API-22 | PATCH /admin/orders/:id/status | مدیر سفارش | transition مجاز، reason و version؛ audit |
| API-23 | POST /admin/ai/drafts | مدیر محتوا | scope و locale → jobId؛ بدون انتشار خودکار |
| API-24 | GET /admin/jobs/:id | مدیر مجاز | progress و خطای پالایش‌شده |
| API-25 | PUT /admin/ai/settings | مدیر تنظیمات | کلید write-only و تنظیم مدل/بودجه؛ رمزنگاری و audit بدون secret |
| API-26 | GET /health/live | عمومی حداقلی | سلامت process؛ بدون اطلاعات زیرساخت |
| API-27 | GET /health/ready | زیرساخت مجاز | آمادگی وابستگی‌ها؛ سیاست دسترسی هنگام deploy |

ورود، خروج، ثبت‌نام، تأیید ایمیل و بازیابی رمز در [AUTH.md](./AUTH.md) تعریف شده‌اند؛ URL آن‌ها تا انتخاب کتابخانه تعیین نشده است. عملیات پنل ممکن است Server Action بمانند؛ فقط مسیرهایی که واقعاً لازم‌اند ساخته می‌شوند. هنگام پیاده‌سازی هر ردیف باید وضعیت، schema دقیق، pagination، permission، rate limit، کد خطا و تست قرارداد تکمیل شود؛ این فهرست تعهد ایجاد endpoint غیرضروری نیست.

## پیشرفت R04 — ۲۰۲۶/۱۰/۳۱

مسیرهای زیر اجرایی‌اند و برخلاف قرارداد تجاری آینده /api/v1 نیستند:

| روش / مسیر | دسترسی و رفتار |
| --- | --- |
| POST /api/auth/sign-up/email | عمومی؛ name، email، password؛ فقط CUSTOMER |
| POST /api/auth/sign-in/email | عمومی؛ email، password؛ تأیید ایمیل الزامی |
| POST /api/auth/send-verification-email | عمومی؛ email؛ پاسخ عمومی |
| POST /api/auth/verify-email | عمومی؛ token در body؛ مصرف یک‌بار |
| POST /api/auth/request-password-reset | عمومی؛ email؛ پاسخ عمومی |
| POST /api/auth/reset-password | عمومی؛ token و newPassword |
| POST /api/auth/change-password | نشست معتبر؛ currentPassword و newPassword |
| POST /api/auth/sign-out | خروج و ابطال نشست |
| POST /api/auth/revoke-other-sessions | نشست معتبر؛ ابطال سایر نشست‌ها |
| GET /api/account | user امن یا null؛ بدون token |
| PATCH /api/account | نشست معتبر؛ فقط name |
| GET /api/account/sessions | فقط نشست‌های همان کاربر؛ بدون token |
| DELETE /api/account/sessions | نشست معتبر؛ id متعلق به همان کاربر |
| GET /api/admin/access | permission کاتالوگ و تغییر رمز اولیه انجام‌شده |

GET روی catch-all auth و مسیرهای خارج از allowlist برابر 404 هستند. جزئیات AUTH و API را رعایت کنید.
