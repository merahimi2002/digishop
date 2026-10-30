# استقرار و انتشار

وضعیت: runbook عمومی؛ provider، region و topology هنوز انتخاب نشده‌اند. دستورهای مختص provider پس از انتخاب افزوده می‌شوند.

## انتخاب زیرساخت

میزبانی باید runtime منتخب Next.js، Prisma و اتصال PostgreSQL، job بادوام، callback قابل دسترس درگاه ایران، object storage و secret management را پشتیبانی کند. latency کاربران ایران، محدودیت اتصال سرویس‌ها، بودجه، pool اتصال و scaling بررسی شوند. job طولانی به lifecycle درخواست وب وابسته نباشد.

## مسیر انتشار

۱. CI: config/i18n validation، lint، typecheck، تست‌های مرتبط و build با lockfile ثابت.
۲. deploy در staging جدا؛ migration سازگار، تست callback، ایمیل و storage؛ noindex همراه محافظت واقعی staging.
۳. بررسی آمادگی داده فروشنده، دامنه، سیاست‌ها، بکاپ، budget AI و پایش؛ ثبت evidence در EXECUTION.
۴. migration تولید با دسترسی کنترل‌شده و استراتژی سازگار؛ snapshot/backup طبق نوع تغییر.
۵. انتشار artifact قابل شناسایی با commit/build ID و health/readiness؛ smoke هر دو زبان و خرید کنترل‌شده.
۶. بررسی error rate، latency، callback و job queue؛ ثبت زمان و نتیجه.

دامنه canonical، TLS، redirectها، cookies، originها، allowlist storage و محدودیت callback در تولید بررسی شوند. preview هرگز به دیتابیس یا تسویه production متصل نشود.

## برگشت

artifact قبلی و تغییر feature flag در دسترس باشند. rollback کد فقط با schema سازگار انجام شود؛ migration مخرب با revert کور اصلاح نمی‌شود. در مشکل مالی، checkout جدید متوقف ولی دریافت callback و reconciliation امن حفظ شود. پیش از بازگشایی، وضعیت تراکنش‌های در جریان بررسی شود. تأیید انتشار مطابق دستور جاری مالک است؛ درخواست فعلی فقط مستندسازی را مجاز کرده است.

