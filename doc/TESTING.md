# راهبرد آزمون

وضعیت: Vitest و Playwright نصب شده‌اند؛ تست‌های R01 برای config، env، ترجمه، query isolation و مسیرهای مرورگر فعال‌اند. آزمون‌های مالی/دیتابیس/AI مربوط به مراحل آینده‌اند. معیارهای کلی در [QUALITY.md](./QUALITY.md) است؛ نتیجه واقعی در EXECUTION ثبت می‌شود.

## سطوح

| سطح | ابزار پیشنهادی | پوشش مهم |
| --- | --- | --- |
| static | TypeScript، Oxlint، config/i18n validation | نوع، پیام ناقص و تنظیم نامعتبر |
| unit | Vitest | پول، تخفیف، validation و state transition |
| integration | Vitest با PostgreSQL تست جدا | constraint، تراکنش، رقابت، مالکیت و idempotency |
| contract | schema و تست Route Handler/provider adapter | DTO، خطا و قرارداد callback |
| end-to-end | Playwright | ورود، کاتالوگ، سبد، checkout، پنل در fa/en |
| accessibility | ابزار خودکار مناسب + تست دستی | keyboard، screen reader، contrast و focus |
| performance | Lighthouse آزمایشگاهی + داده میدانی بعداً | مسیرهای اصلی روی build تولید |

## سناریوهای اولویت بالا

### بازگشت خطای ThemeProvider

`tests/e2e/theme-navigation.spec.ts` هم console.error و هم pageerror را ثبت می‌کند؛ تست فقط با crash-free بودن پاس نمی‌شود. سناریوها: fa → en → fa با حفظ تم، روشن/تاریک/سیستم و تغییر واقعی media preference، reload، دو تب و storage مسدود. خطای گزارش‌شده قبل از اصلاح با همین تست در dev بازتولید شد.

`pnpm test:e2e:dev --workers=2` سرور مستقل Next dev/Turbopack را روی 3100 با خروجی `.next-e2e-dev` اجرا می‌کند؛ `pnpm test:e2e` روی سرور production مستقل پورت 3200 اجرا می‌شود. reuseExistingServer خاموش است تا تست به اشتباه به dev شخصی پورت 3000 وصل نشود. CI هر دو suite را اجرا می‌کند؛ اجرای ابری همچنان نیازمند push است. نتیجه محلی: ۸ تست در هر حالت پاس، بدون خطای کنسول در سناریوهای regression.

- تبدیل ریال/تومان، مبلغ بزرگ، گردکردن تخفیف و جمع اجزا با سیاست مصوب.
- دو خرید هم‌زمان آخرین کالا، expiry رزرو هم‌زمان با verify، callback تکراری/دیررس و retry checkout.
- شکست شبکه بعد از پرداخت موفق؛ reconciliation بدون سفارش یا برداشت تکراری.
- مشتری A در برابر اطلاعات B، دسترسی غیرمدیر، session منقضی و CSRF.
- تغییر قیمت/موجودی پس از افزودن به سبد؛ variant نامعتبر یا غیرفعال.
- locale نامعتبر، پیام گمشده، جهت درست، تعویض زبان در محصول و کش جدا.
- AI prompt injection، ابزار غیرمجاز، تأیید منقضی/تغییر payload، افشای داده و اتمام بودجه.
- خروج از حساب و ورود حساب دیگر بدون باقی ماندن داده خصوصی در Query cache.

داده آزمون deterministic و بدون PII واقعی؛ زمان، provider و failure قابل کنترل باشند. mock provider فقط منطق داخلی را ثابت می‌کند؛ اتصال با sandbox واقعی نیز بررسی شود. دیتابیس تست هرگز production نباشد.

در هر تغییر آزمون متناسب اجرا و نتیجه با فرمان، محیط و خلاصه evidence در EXECUTION ثبت شود. تست‌های قرمز به‌خاطر سهولت حذف/skip نشوند. پوشش درصدی به‌تنهایی معیار صحت نیست. تغییر کم‌ریسک متن تست تقلیدی نمی‌خواهد. قبل از انتشار، ماتریس مرورگر/موبایل، هر دو زبان و هر دو تم تکمیل شود.

