# سیستم طراحی و UX

وضعیت: صفحه پایه، لوگو و سه انتخاب تم در R01 ساخته شده‌اند؛ طراحی کامل فروشگاه مربوط به R02 است. دامنه صفحه‌ها در [PRODUCT.md](./PRODUCT.md) و معیارهای AA در [QUALITY.md](./QUALITY.md) است.

## هویت و اجزا

سبک مدرن و مینیمال با glass کنترل‌شده. رنگ، فونت، spacing، radius، shadow، motion و لایه‌بندی از token مشترک. رنگ و دارایی برند فقط از BUSINESS_CONFIG؛ theme paletteها token-based باشند. shadcn/ui پایه رفتار و اجزا است، ظاهر فروشگاه اختصاصی طراحی می‌شود.

تم روشن، تاریک و سیستم؛ انتخاب کاربر پایدار و بدون flash/خطای hydration تا حد ممکن با راهکار سازگار SSR. contrast روی پس‌زمینه واقعی سنجیده شود. glass برای هدر/منو/لایه شناور؛ قیمت، متن و فرم سطح خوانا دارند. fallback بدون blur ضروری است.

## چندزبانگی و responsive

### قرارداد تم اجرایی

ThemeProvider محلی در `src/components/theme-provider.tsx` هیچ script در render ندارد. hook محلی `useTheme` انتخاب light/dark/system را ارائه می‌کند؛ external store با useSyncExternalStore، matchMedia و storage event همگام می‌شود. preference در حافظه کلاینت هنگام تغییر locale حفظ و در صورت دسترسی در localStorage با کلید theme ذخیره می‌شود؛ شکست storage تعامل همان document را متوقف نمی‌کند.

bootstrap کوچک از تابع مستقل `src/lib/theme.ts` و defaultTheme تنظیمات مرکزی به `public/brand/theme-init.js` تولید می‌شود. در root layout به‌صورت external async script با پشتیبانی resource deduplication خود React قرار دارد؛ script خام inline و next-themes حذف شده‌اند. CSS لوگو همان tokenهای تأییدشده است. html دارای data-scroll-behavior مناسب navigation است. این روش نباید با تزریق inline script به Provider یا مخفی کردن console error جایگزین شود.

`lang/dir` صحیح روی سند؛ logical properties و isolation متن‌های mixed. آیکون جهتی آینه شود، تصویر محصول و لوگو خیر. متن انگلیسی طولانی، نام فارسی چندخطی، عدد بزرگ، فونت fallback و breakpoints بر اساس محتوا تست شوند. موبایل از ابتدا، بدون scroll افقی غیرضروری؛ جدول مقایسه الگوی دسترسی مناسب داشته باشد.

## حالت‌های لازم هر قابلیت

| حالت | رفتار |
| --- | --- |
| loading | skeleton با ابعاد پایدار؛ اعلان مناسب بدون مزاحمت |
| empty | توضیح روشن و اقدام بعدی واقعی |
| error | پیام قابل اصلاح و retry در صورت ایمن بودن |
| submitting | جلوگیری از ارسال تکراری و حفظ داده فرم |
| success | تأیید واضح و مرحله بعد |
| stale/conflict | توضیح تغییر قیمت/موجودی و بازبینی پیش از خرید |
| unauthorized/expired | ورود مجدد با حفظ مسیر بازگشت امن |
| offline | نگه داشتن ورودی ممکن؛ ادعای ثبت سفارش موفق نشود |
| unavailable | جایگزین روشن برای محصول/سرویس غیرفعال |

جست‌وجو، فیلتر، انتخاب variant، سبد و checkout باید قابل استفاده با صفحه‌کلید و touch باشند. focus visible، dialog focus management، label، خطای فیلد و اعلام وضعیت لحاظ شوند. hover تنها راه دسترسی نباشد. animation رعایت reduced-motion و کنترل حرکت داشته باشد.

## محتوا

لحن واضح و یکدست فارسی/انگلیسی؛ ترجمه واقعی و بدون متن hardcode. تصویر محصول منطبق با کالای واقعی، alt توصیفی و مجوز استفاده مشخص؛ بنر تولیدی با عکس واقعی محصول اشتباه نشود. نظر، شمار فروش، تخفیف و badge اعتماد بدون پشتوانه نمایش داده نشوند. نخست نمونه خانه/محصول برای اصلاح مالک آماده شود، سپس الگو به صفحات دیگر گسترش یابد.

