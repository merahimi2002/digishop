# قرارداد دیتابیس

وضعیت: طراحی منطقی؛ schema Prisma و migration هنوز وجود ندارند. PostgreSQL منبع معتبر داده تجاری است.

## روابط و محدودیت‌ها

| حوزه | رابطه/محدودیت ضروری |
| --- | --- |
| User | شناسه پایدار؛ ایمیل و تلفن نرمال‌شده در صورت وجود یکتا؛ نقش پیش‌فرض customer |
| Session و token | وابسته به User، انقضا و ابطال؛ هش توکن‌های یک‌بارمصرف |
| Address | متعلق به User؛ جدا از OrderAddress snapshot |
| Product | Category و ProductBrand؛ ProductTranslation با unique(productId, locale) |
| ترجمه | slug محلی یکتا در دامنه مسیر تعریف‌شده؛ تاریخچه redirect پس از تغییر |
| Variant | وابسته به Product؛ SKU یکتا و ترکیب option یکتا برای محصول |
| Attribute | تعریف دارای نوع/واحد/دامنه دسته؛ value سازگار با نوع و قابل ترجمه در صورت نیاز |
| Media | metadata فایل، مالکیت و وضعیت بررسی؛ alt محلی؛ orphan cleanup کنترل‌شده |
| Inventory | موجودی و version؛ movement غیرقابل ویرایش عادی؛ رزرو با expiry و وضعیت نهایی |
| Cart | مالک user یا guest token امن طبق سیاست؛ CartItem یکتای cart/variant |
| Order | snapshot اقلام/آدرس، مبلغ اجزا، currency و وضعیت‌های مستقل؛ حذف کاربر باعث حذف سفارش مالی نشود |
| PaymentAttempt | reference provider یکتا در دامنه provider؛ idempotency key با hash درخواست |
| CouponUsage | سقف مصرف و unique لازم برای جلوگیری از مصرف مجدد |
| Audit/Outbox/Job | actor، operation، زمان، correlation و وضعیت retry؛ بدون secrets |
| AI | conversation owner، ابزار/مصرف و expiry؛ داده حساس حداقلی |

## انواع و تراکنش

زمان‌ها UTC با نوع timezone-aware؛ شناسه‌ها غیرقابل حدس ترجیح داده شوند ولی جای authorization نیستند. مبلغ ریال صحیح و محدوده نوع انتخاب‌شده تست شود. quantity و مبلغ منفی با constraint مناسب رد شوند. JSON فقط برای metadata محدود؛ ویژگی فیلترپذیر رابطه‌ای و دارای نوع باشد.

رزرو موجودی، مصرف coupon و ثبت transition پرداخت باید با تراکنش و کنترل رقابت درست شوند؛ انتخاب قفل/atomic update/isolation در R03/R07 مستند و با تست رقابت اثبات شود. درخواست شبکه در تراکنش طولانی نگه داشته نشود.

indexها بر مبنای queryهای واقعی: slug/locale، SKU، دسته و انتشار، userId/createdAt سفارش، provider reference، reservation expiry و job status. query plan و N+1 با seed نماینده بررسی شوند؛ فهرست کامل index در schema نهایی ثبت شود.

## چرخه داده

migration در کنترل نسخه، seed دمو جدا و بدون داده واقعی شخصی. اجرای production با اعتبارسنجی بکاپ و استراتژی expand/contract برای تغییر ناسازگار؛ rollback کد لزوماً rollback schema نیست. حذف catalog مرجع سفارش را نشکند؛ archive و سیاست retention به حذف کور ترجیح دارند. بازیابی بکاپ در محیط جدا تست و مدرک ثبت شود؛ جزئیات در OPERATIONS.

