# تنظیمات مرکزی کسب‌وکار

این فایل تنها منبع قابل ویرایش برای هویت و تنظیمات عمومی کسب‌وکار است. برای تغییر برند یا واگذاری پروژه، مقادیر این فایل تغییر می‌کنند؛ نام برند، راه‌های تماس و دامنه نباید در کامپوننت‌ها یا متن‌های عمومی hardcode شوند.

بخش YAML با `pnpm config:generate` پس از validation با Zod به تنظیمات type-safe، هندسه لوگو و CSS تبدیل می‌شود. `src/config/generated/`، `src/app/brand.generated.css`، `public/brand/mark.svg` و bootstrap تم `public/brand/theme-init.js` خروجی‌اند و دستی ویرایش نمی‌شوند. dev/build تولید را اجرا می‌کنند؛ پس از تغییر این فایل در زمان dev سرور را دوباره اجرا کنید. کلیدها ثابت و مقدارها قابل تغییرند. `null` یعنی نامشخص؛ `pnpm config:release` داده ضروری ناقص را رد می‌کند و اکنون به دلیل نبود اطلاعات فروش واقعی باید fail شود.

```yaml
schemaVersion: 1
brand:
  key: digishop
  names:
    fa: دیجی شاپ
    en: Digishop
  legalName: null
  taglines:
    fa: null
    en: null
  descriptions:
    fa: null
    en: null
  domain: null
  logoLightPath: assets/brand/digishop-mark.svg
  logoDarkPath: assets/brand/digishop-mark.svg
  faviconPath: null
  socialImagePath: null
business:
  model: single-vendor
  productType: physical
  initialCategory: computer-hardware-and-accessories
  targetCountry: IR
  timezone: Asia/Tehran
  sellerAddress: null
  postalCode: null
  taxIdentifier: null
contact:
  supportEmail: null
  supportPhone: null
  supportHours: null
  socialLinks: []
localization:
  defaultLocale: fa
  locales:
    - code: fa
      direction: rtl
      label: فارسی
    - code: en
      direction: ltr
      label: English
  displayCurrency: IRT
  storageCurrency: IRR
  englishPricesAreTranslatedOnly: true
appearance:
  defaultTheme: system
  availableThemes: [light, dark]
  style: modern-minimal-glass
  primaryColor: '#0F766E'
  logoColors:
    light:
      base: '#0B1F3A'
      accent: '#0F766E'
    dark:
      base: '#EDF2F7'
      accent: '#2DD4BF'
  persianFont: null
  latinFont: null
auth:
  initialMethod: email-password
  plannedMethod: phone-otp
  googleOAuthEnabled: false
commerce:
  paymentProvider: null
  shippingProvider: null
  shippingRegions: []
  guestCheckout: null
  taxPolicy: null
  inventoryReservationMinutes: null
  returnPolicyApproved: false
ai:
  customerAssistantEnabled: false
  adminAssistantEnabled: false
  provider: null
  model: null
  monthlyBudget: null
  budgetCurrency: null
deployment:
  hostingProvider: null
  storageProvider: null
  transactionalEmailProvider: null
  smsProvider: null
  analyticsProvider: null
```

`IRT` در این قرارداد شناسه داخلی نمایش تومان است، نه ارز ISO. پرداخت و ذخیره مبلغ بر حسب ریال صحیح انجام می‌شود؛ تبدیل تومان فقط در مرز نمایش و مطابق قرارداد درگاه است. زبان انگلیسی به معنی فعال شدن فروش خارجی یا تبدیل ارز نیست.

## اطلاعاتی که باید از مالک گرفته شود

فهرست پرسش‌ها، وضعیت پاسخ و موعد نیاز در [OWNER_INPUT.md](./OWNER_INPUT.md) نگهداری می‌شود. مقادیر پاسخ فقط در همین فایل یا منبع داده تخصصی خود ثبت شوند؛ هویت برند در فایل دیگری تکرار نشود. پرسش‌های آینده مانع ساخت بخش‌های مستقل نیستند.

## قرارداد تغییر برند

- ترجمه‌های عمومی از نام‌های `brand.names` استفاده می‌کنند؛ نام برند داخل پیام‌های ترجمه تکرار نمی‌شود.
- لوگو، favicon و تصویر اشتراک‌گذاری از مسیرهای همین فایل خوانده می‌شوند. برای تغییر ظاهر دارایی، فایل جدید تولید یا جایگزین می‌شود.
- عنوان صفحات، ایمیل‌ها، فاکتور، manifest، structured data و پیام‌های دستیار AI از همین هویت استفاده می‌کنند.
- تنظیمات runtime تولیدشده ویرایش دستی نمی‌شوند. CI اعتبار YAML، کلیدهای زبان و نبود مقدار ضروری نامشخص در build انتشار را بررسی می‌کند.
- افزودن زبان: ثبت زبان در این فایل، تکمیل فایل پیام‌ها و محتوای ترجمه‌شده، و گذراندن کنترل‌های RTL/LTR و SEO. صرف افزودن کد زبان ترجمه تولید نمی‌کند.
- کلید API، رمز عبور، اطلاعات اتصال دیتابیس، کلید رمزنگاری و توکن در این فایل قرار نمی‌گیرند. آن‌ها در secret store یا متغیر محیطی سرور نگهداری می‌شوند.
- تغییر مالکیت واقعی نیازمند تعویض secrets، انتقال سرویس‌ها و بررسی داده‌های مشتریان است؛ ویرایش این فایل هویت نمایشی برنامه را تغییر می‌دهد.



