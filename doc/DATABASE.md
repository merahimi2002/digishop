# قرارداد و راه‌اندازی دیتابیس

وضعیت R03: پیاده‌سازی و بررسی‌شده. PostgreSQL 18.6 منبع داده و Prisma 7.10.1 ORM است؛ فرانت R02 هنوز به کاتالوگ دیتابیس متصل نشده و فروش/ورود واقعی فعال نیستند. شواهد در [EXECUTION.md](./EXECUTION.md).

## ساختار فعلی

۴۱ مدل در `prisma/schema.prisma` و دو migration نسخه‌بندی‌شده:

| حوزه | مدل‌ها و قرارداد |
| --- | --- |
| حساب | User، Session، Account، Verification، Address؛ نقش پیش‌فرض CUSTOMER، ایمیل lowercase/trim و تلفن E.164 یکتا |
| دسته/برند | Category و CategoryTranslation، ProductBrand و BrandTranslation؛ parent محدود، حلقه دسته رد می‌شود |
| محصول | Product، ProductTranslation و ProductSlugHistory؛ DRAFT پیش‌فرض، isDemo، slug یکتای locale، حفظ namespace تاریخچه |
| ویژگی | Attribute/Translation، CategoryAttribute، AttributeChoice/ChoiceTranslation، ProductAttributeValue؛ TEXT/NUMBER/BOOLEAN/OPTION و Decimal، واحد، انتخاب معتبر و scope مستقیم دسته |
| variant | ProductOption/Translation، OptionValue/Translation، Variant، VariantSelection؛ SKU یکتا، ترکیب کامل و canonical، FK مرکب مانع option محصول دیگر |
| تصویر | Media/Translation و ProductMedia؛ storageKey، وضعیت بررسی، alt محلی، ابعاد/حجم مثبت، ترتیب یکتا |
| انبار | Inventory، InventoryReservation، InventoryMovement؛ onHand/reserved/version، انقضا و ledger append-only |
| سبد | Cart و CartItem؛ دقیقاً یکی از user یا hash مهمان، cart/variant یکتا و quantity مثبت |
| سفارش | Order، OrderItem، OrderAddress؛ نام/SKU/options/قیمت/آدرس snapshot مستقل از رکورد کاربر و کاتالوگ |
| پرداخت/تخفیف | PaymentAttempt، Coupon، CouponUsage، IdempotencyRecord؛ reference در scope provider و key یکتا، hash درخواست، سقف مصرف |
| عملیات | AuditEvent append-only و OutboxEvent با retry/availableAt؛ worker عملیاتی در R08 |

شناسه‌ها UUID تولیدشده توسط PostgreSQL؛ timestampها Timestamptz(3) و اتصال/دیتابیس محلی UTC. locale رشته اعتبارسنجی‌شده است و enum دو زبانه نیست؛ اضافه کردن زبان به migration وابسته نیست. هر محصول فعلاً یک دسته اصلی دارد؛ ارث‌بری خودکار ویژگی از والد فعال نیست و mapping مستقیم دسته لازم است.

## قیدهای SQL و تراکنش

- مبلغ فقط IRR صحیح با BigInt است؛ قیمت منفی رد می‌شود. JSON/API آینده باید مبلغ را رشته decimal منتقل کند، نه Number یا تغییر سراسری BigInt.prototype.
- `0 <= reserved <= onHand`، quantity مثبت و نسخه نامنفی. `reserveInventory` با UPDATE شرطی موجودی آزاد و ایجاد رزرو در یک transaction کار می‌کند. ۲۰ درخواست روی ۳ موجودی دقیقاً ۳ موفقیت داشتند. release با transition شرطی ACTIVE تنها یک بار شمارنده را کم می‌کند؛ EXPIRED زودتر از expiresAt مجاز نیست.
- این primitive داخلی authorization، اتصال به cart/order، TTL تجاری یا quote فروش ندارد؛ R06/R07 باید مالکیت و binding رزرو را در سرویس checkout اضافه کنند. موتور فروش کامل به‌خاطر این تست DONE نشده است.
- کلید variant حاصل مرتب‌سازی `optionId=valueId` است؛ بدون option برابر default. deferred constraint trigger در commit کامل بودن انتخاب‌ها و تطبیق کلید را بررسی می‌کند؛ فقط unique روی رشته ارسالی کافی نیست.
- نوع ویژگی با FK مرکب kind، دقیقاً یک ستون مقدار و scope CategoryAttribute کنترل می‌شود. تغییر دسته یا حذف scope در حال استفاده رد می‌شود.
- جمع اجزای Order و مقدار هر OrderItem کنترل می‌شود. PaymentAttempt باید هم‌اندازه total سفارش باشد؛ بعد از شروع attempt، مبلغ سفارش و هویت attempt ثابت‌اند. reference provider پس از تعیین تغییر نمی‌کند. یک پرداخت SUCCEEDED در هر سفارش با partial unique index.
- حذف کاربر، Order را حذف نمی‌کند؛ userId null می‌شود و snapshot می‌ماند. CouponUsage دارای Restrict است؛ حذف/ناشناس‌سازی کاربران دارای مصرف مالی در سیاست retention مرحله auth/عملیات تصمیم می‌خواهد.
- Invoice/refund، مجموع snapshot اقلام نسبت به subtotal، transition کامل پرداخت/سفارش و idempotency hash conflict باید در R07 با سرویس و تست گردش واقعی تکمیل شوند. یک unique key جای کل گردش پرداخت را نمی‌گیرد.
- رقابت coupon در R07 با افزایش شرطی usedCount زیر سقف و ثبت CouponUsage در همان transaction انجام شود. قید سقف و unique مصرف اکنون موجود است، سرویس redeem هنوز ساخته نشده.

Indexهای locale/slug، SKU، دسته/status/createdAt، user/createdAt سفارش، reference provider، reservation status/expiry و outbox آماده‌اند. EXPLAIN واقعی روی ۲۰۰۰ ترجمه از ProductTranslation_locale_slug_key استفاده کرد؛ مدرک محلی در `output/r03/query-plan.json`. این ارزیابی همه queryهای آینده یا benchmark تولید نیست؛ R05 باید فیلترهای واقعی/N+1 را بررسی کند.

## نقش‌ها و اتصال

- `DATABASE_URL`: حساب برنامه با DML محدود، بدون CREATE و بدون خواندن `_prisma_migrations`.
- `DIRECT_DATABASE_URL`: owner اجرای migration؛ وارد runtime مرورگر یا لاگ نمی‌شود.
- `SHADOW_DATABASE_URL`: دیتابیس مستقل و disposable برای migrate dev/diff. هرگز همان app database نباشد.
- Prisma client با adapter-pg، pool حداکثر ۱۰ اتصال در هر process، timeout اتصال ۵s و idle ۱۰s ساخته می‌شود. getDatabase سروری و lazy است؛ build/پیش‌نمایش بدون DB کار می‌کنند. client تولیدی در src/generated/prisma gitignored و پیش از build/typecheck تولید می‌شود.

## ویندوز بدون Docker — مسیر بررسی‌شده این دستگاه

پیش‌نیاز: ابزار Node/pnpm پروژه مطابق DEVELOPMENT. از ریشه مخزن:

```powershell
.\scripts\install-postgres.ps1
.\scripts\pnpm.ps1 db:up
.\scripts\pnpm.ps1 db:setup:local
.\scripts\pnpm.ps1 db:migrate
.\scripts\pnpm.ps1 db:grant:local
.\scripts\pnpm.ps1 test:db
```

PostgreSQL فقط روی `127.0.0.1:55432` بالا می‌آید. bootstrap حساب admin/owner/app جدا و رمزهای تصادفی می‌سازد؛ credentialها فقط در `.tools/local-db.json` و `.env.local`/`.env.test.local` gitignored هستند. برنامه از admin استفاده نمی‌کند. فایل‌های دیتابیس زیر `.tools/postgres/data` هستند؛ سرویس ویندوز یا autostart سراسری نصب نمی‌شود. `db:down` همین cluster را متوقف و داده را حفظ می‌کند. هیچ reset/delete خودکار روی دیتابیس موجود انجام نمی‌شود.

EDB رسمی در این شبکه با 403 منطقه‌ای مسدود بود. اسکریپت نصب payload بومی را از بسته transport `@embedded-postgres/windows-x64@18.6.0-beta.19` می‌گیرد و SHA-512 آن را با npm integrity تطبیق می‌دهد. برچسب beta متعلق به بسته‌بندی transport است؛ اجرایی واقعی `postgres --version` برابر PostgreSQL 18.6 stable است. helper جاوااسکریپت beta به dependency برنامه اضافه نشده. این transport برای توسعه محلی است؛ استقرار واقعی باید از PostgreSQL مدیریت‌شده یا image رسمی انتخاب‌شده استفاده کند.

## Docker — جایگزین آماده، اجرا نشده روی این دستگاه

`compose.yaml` با image رسمی postgres:18.6، volume پایدار و bind لوپ‌بک آماده است. از مسیر portable و Docker هم‌زمان روی یک پورت استفاده نکنید.

```powershell
docker compose up -d postgres
```

سپس فقط برای توسعه محلی، در `.env.local`:

```dotenv
APP_ENV=local
DATABASE_URL=postgresql://digishop_app:local-only-app@127.0.0.1:55432/digishop
DIRECT_DATABASE_URL=postgresql://digishop_owner:local-only-owner@127.0.0.1:55432/digishop
```

و در `.env.test.local` همان نقش‌ها با نام دیتابیس `digishop_test` و APP_ENV=test. این‌ها fixtureهای عمومی local-only هستند، credential تولید نیستند. `db:migrate`، `db:grant:local` و `test:db` بعد از تنظیم URLها اجرا شوند. برای migrate dev در Docker، shadow DB مستقل با owner ساخته و SHADOW_DATABASE_URL جدا تنظیم شود؛ این مسیر در این دستگاه اجرا نشده است.

## migration و seed

- `db:generate` تولید client؛ `db:validate` اعتبار schema؛ `db:migrate` اجرای migrate deploy؛ `db:migrate:test` فقط مقصد *_test؛ `db:status` بررسی تاریخچه.
- برای تغییر schema از migration جدید و بررسی SQL استفاده کنید. custom SQL/trigger و partial indexها بخشی از تاریخچه‌اند؛ db push، ویرایش migration اعمال‌شده، reset یا پذیرش خودکار drop/reset جای workflow نیستند. migrate dev به shadow مستقل نیاز دارد.
- rollback کد معادل rollback schema نیست. تغییر ناسازگار با expand/contract و backup تأییدشده انجام شود؛ down migration داده از دست‌رفته را برنمی‌گرداند. restore تولید در R11 آزمون جدا می‌خواهد.
- seed پیش‌فرض اجرا نمی‌شود. برای اجرای محلی صریح:

```powershell
$env:DEMO_SEED_ENABLED='true'
.\scripts\pnpm.ps1 db:seed
Remove-Item Env:DEMO_SEED_ENABLED
```

seed شامل ۳ Product/Variant آزمایشی، ترجمه fa/en، یک option و ویژگی عددی است. همه Productها isDemo و DRAFT هستند؛ قیمت/موجودی fixture هستند و روی UI عرضه نمی‌شوند. Media صرفاً metadata آزمایشی PENDING دارد، upload واقعی نیست. حساب کاربری/رمز پیش‌فرض ساخته نمی‌شود؛ seed موجودی موجود را reset نمی‌کند و رکورد واقعی را جایگزین نمی‌کند. اجرای seed در production/preview رد می‌شود.

## مرز مرحله بعد

R04 باید auth واقعی، hash ذخیره‌شده Verification.value، تطبیق roleها با Better Auth، session/revocation، مدیریت امن credential و مجوز را پیاده کند. schema موجود به‌تنهایی ورود فعال یا adapter تأییدشده Better Auth نیست. AI conversation و worker/job اختصاصی هنوز در مراحل مربوط خود هستند. اطلاعات شخصی واقعی، اتصال درگاه و تغییر UI عمومی به داده DB جزو R03 نبودند.

منابع: [Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)، [Prisma Client](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction)، [PostgreSQL Windows](https://www.postgresql.org/download/windows/)، [EDB binaries](https://www.enterprisedb.com/download-postgresql-binaries)، [transport source](https://github.com/leinelissen/embedded-postgres).
