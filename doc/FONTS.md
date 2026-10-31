# فونت‌ها

انتخاب قطعی مالک برای فارسی **Vazirmatn** است؛ درخواست قبلی IRANSans لغو شد و فایل شخصی لازم نیست.

- بسته: `@fontsource/vazirmatn@5.3.0`؛ نسخه stable از npm registry هنگام نصب بررسی شد.
- در `src/app/globals.css`: import اصلی `@fontsource/vazirmatn` برای ۴۰۰، و CSS وزن‌های ۵۰۰، ۶۰۰ و ۷۰۰.
- فونت‌ها در build از پکیج bundle و از خود سایت دریافت می‌شوند؛ اتصال runtime به Google Fonts یا CDN لازم نیست.
- نام family در BUSINESS_CONFIG قرار دارد و `--font-fa` با generator ساخته می‌شود. انگلیسی fallback Arial دارد. تغییر نام config به‌تنهایی فونت تازه دانلود نمی‌کند؛ برای تغییر family، import معتبر نیز باید تغییر کند.
- بارگذاری واقعی با document.fonts.load/check و computed font-family در Playwright فارسی بررسی شده است.
- مجوز همراه بسته OFL-1.1 است؛ نسخه اصلی متن مجوز بدون تغییر در `public/fonts/vazirmatn-OFL.txt` قرار دارد.

منبع: [Fontsource Vazirmatn](https://fontsource.org/fonts/vazirmatn). فونت یا فایل کلید محرمانه‌ای در این مسیر وجود ندارد.
