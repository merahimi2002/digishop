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

## R05 — ساختار کاتالوگ، ۲۰۲۶/۱۰/۳۱

مسیر اجرایی جدید: /api/admin/catalog/{categories|brands|attributes} با GET، POST، PATCH و DELETE. فقط ADMIN/OWNER دارای catalog:write، ایمیل تأییدشده و تغییر رمز اولیه انجام‌شده مجازند.

- GET: q حداکثر۱۰۰ کاراکتر و page بین۱ و۱۰۰۰۰؛ ۳۰ ردیف، total/pages و category lookup.
- POST: code، translations با همه localeهای تنظیمات؛ دسته parentId/slug/description؛ ویژگی kind/unit/categoryIds/choices.
- PATCH و DELETE: id و revision اجباری‌اند. revision قدیمی 409 STALE_EDIT؛ کد/نامک تکراری 409 DUPLICATE؛ رابطه یا چرخه نامعتبر 409 CONFLICT؛ ورودی نامعتبر400، بی‌نشست401 و بدونمجوز403.
- پاسخ همه روش‌ها private/no-store است. POST برابر201 و پاسخ mutation دارای item یا null برای حذف است. endpoint محصول و API عمومی فروشگاهی در این بخش ساخته نشده‌اند.


## R05 — محصول و فروشگاه، ۲۰۲۶/۱۱/۰۲

مسیر اجرایی محصول: /api/admin/catalog/products؛ GET، POST و PATCH. همان مجوز catalog:write، تأیید ایمیل، تغییر رمز، same-origin و rate limit کاتالوگ اعمال می‌شود. DELETE با 405 ARCHIVE_REQUIRED رد می‌شود؛ بایگانی با PATCH انجام می‌شود.

- GET: q (نام یا SKU، حداکثر۱۰۰) و page (۱..۱۰۰۰۰)، ۲۰ محصول با ترجمه‌ها/گزینه‌ها/variant و revision، lookup دسته/برند تا۵۰۰.
- POST/PATCH: categoryId، brandId یا null، status از DRAFT/PUBLISHED/ARCHIVED، isDemo، translations کامل fa/en با name/slug/description، options با code/translations/values و variants با sku/priceIrr/active/onHand/selections. انتخاب با {option: code, value: code} است. سقف۳ گزینه،۴۰ مقدار در هر گزینه و۱۰۰ variant؛ body حداکثر۲۵۶KiB.
- priceIrr رشته ده‌دهی صحیح غیرمنفی تا سقف PostgreSQL BigInt است؛ عدد JSON/اعشار/نمای علمی پذیرفته نیست. SKU trim و uppercase می‌شود. انتشار حداقل یک variant فعال و قیمت مثبت برای تمام variantهای فعال می‌خواهد.
- PATCH: id و revision و تمام variantهای موجود با id لازم‌اند. هویت ترکیب variant و ساختار کد گزینه/مقدار پس از ساخت ثابت است. غیرفعال‌سازی جایگزین حذف است؛ variant جدید با ترکیب استفاده‌نشده از گزینه‌های اولیه قابل افزودن است.
- 409: STALE_EDIT، RESERVED_STOCK، OPTION_STRUCTURE، VARIANT_IDENTITY، REQUIRED_ATTRIBUTES یا DUPLICATE. اعتبارسنجی400، بدوننشست401، بدونمجوز403، محدودیت429؛ پاسخ‌ها private/no-store. POST=201، PATCH=200 و {item}.
- endpoint عمومی JSON ساخته نشده؛ Server Componentهای خانه، دسته‌ها، /collection و /products/[slug] مستقیماً سرویس عمومی را می‌خوانند. این DTO وضعیت خصوصی، revision و reserved را منتشر نمی‌کند.


قرارداد نهایی ۲۰۲۶/۱۱/۰۲: ثبات گزینه‌ها به معنی حفظ محورهای گزینه و کد مقدارهای موجود است. افزودن مقدار جدید به محور موجود و ساخت variant جدید برای آن در پنل/API مجاز است؛ حذف یا تغییر کد موجود و تغییر ترکیب variant ذخیره‌شده مجاز نیست. این قاعده بر عبارت‌های کلی «ساختار ثابت» در شرح اولیه همین مرحله اولویت دارد.
