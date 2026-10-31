# قرارداد API

وضعیت: طراحی پیشنهادی؛ هیچ endpoint فعلاً وجود ندارد. مرجع مسیرها [API_ENDPOINT.md](./API_ENDPOINT.md) است. Server Actions قرارداد داخلی UI هستند و به‌عنوان API عمومی پایدار معرفی نمی‌شوند.

## پروتکل

- Route Handlerهای JSON با مسیر پیشنهادی `/api/v1`؛ callback درگاه و مسیرهای کتابخانه auth استثنا هستند.
- ورودی و خروجی با schema و DTO مشخص؛ مدل Prisma مستقیماً serialize نشود. مبلغ ریال صحیح به‌صورت رشته عددی و زمان ISO 8601 UTC منتقل شود.
- شناسه پایدار و locale صریح برای محتوای ترجمه‌شده؛ locale نامعتبر خطای validation است.
- فهرست عمومی با pagination محدود و پارامترهای whitelist؛ limit، sort و فیلتر نامعتبر رد شوند. نوع cursor یا page برای هر مسیر ثبت شود.
- پاسخ موفق: `{ data, meta? }`. خطا: `{ error: { code, message, fieldErrors?, requestId } }`. پیام قابل نمایش محلی است؛ code مستقل از زبان باقی می‌ماند.
- وضعیت‌ها: 200 خواندن/ویرایش، 201 ایجاد، 204 بدون بدنه، 400 ورودی خراب، 401 بدون session، 403 مجوز ناکافی، 404 منبع ناموجود/غیرقابل افشا، 409 تعارض قیمت یا وضعیت، 422 validation، 429 محدودیت، 500 خطای ناشناخته، 503 سرویس موقتاً unavailable.
- خطای خام دیتابیس، stack، secret و اطلاعات حساب دیگران بازگردانده نشود.

## امنیت و پایداری

احراز session، CSRF و authorization در سرور؛ CORS پیش‌فرض same-origin. مالکیت هر منبع در query/service بررسی شود. داده خصوصی `no-store`؛ کش عمومی فقط برای کاتالوگ با locale و invalidation مشخص.

برای ایجاد checkout و mutationهای مالی، idempotency key با دامنه user/operation، hash درخواست و نتیجه ذخیره‌شده استفاده شود؛ استفاده مجدد با payload متفاوت 409 است. بازه نگهداری کلید در زمان پیاده‌سازی ثبت شود. مرورگر مجاز به تعیین مبلغ نهایی نیست.

endpointهای upload و AI محدودیت اندازه، زمان و نرخ دارند. قرارداد streaming AI جدا از JSON معمول با رویدادهای start/delta/tool-result/error/done طراحی و disconnect مدیریت شود؛ جزئیات نهایی قبل از ساخت کلاینت ثبت شوند.

هر تغییر ناسازگار قرارداد پیش از انتشار مصرف‌کننده ثبت شود. پس از راه‌اندازی، OpenAPI یا قرارداد schema قابل تولید از کد، نمونه‌های پاک‌سازی‌شده و تست contract اضافه شوند؛ این Markdown به‌تنهایی اثبات اجرای API نیست.

## پیشرفت R04 — ۲۰۲۶/۱۰/۳۱

R04 از envelope محدود {ok:true} برای موفقیت auth و {error:code} برای خطا استفاده می‌کند؛ Bearer/session token در JSON برنمی‌گردد. کدهای AUTH_FAILED، RATE_LIMITED و SESSION_EXPIRED عمداً عمومی‌اند. همه پاسخ‌های خصوصی Cache-Control: private,no-store دارند. نوشتن نیازمند Origin دقیق، JSON و سقف ۸ KiB است. callbackURL ارسالی کلاینت پذیرفته نمی‌شود. فهرست مسیر اجرایی در API_ENDPOINT است؛ استاندارد پیشنهادی API تجاری برای R05+ باقی است.
