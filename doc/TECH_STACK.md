# پشته فنی

وضعیت: وابستگی‌های پایه R01 نصب و pin شده‌اند؛ جدول نسخه‌های واقعی در انتهای سند. دیتابیس، auth و سرویس‌های تجاری در مراحل بعد نصب/متصل می‌شوند.

| حوزه | انتخاب | مسئولیت |
| --- | --- | --- |
| Runtime و package manager | Node.js سازگار با نسخه منتخب Next.js؛ pnpm | نسخه runtime و package manager هنگام bootstrap ثبت و pin شوند |
| اپلیکیشن | Next.js App Router + React + TypeScript strict | SSR، Server Components، Route Handlers و Server Actions |
| دیتابیس | PostgreSQL + Prisma | schema، migration و تراکنش |
| رابط | Tailwind CSS + shadcn/ui | اجزای قابل تغییر و توکن‌های طراحی |
| ترجمه | next-intl | fa/en، routing، پیام ICU و قالب‌بندی |
| داده کلاینت | @tanstack/react-query | query، mutation، invalidation و وضعیت شبکه |
| فرم | React Hook Form + Zod | وضعیت فرم و validation مشترک با بررسی قطعی سرور |
| کیفیت | Oxlint، Prettier، Vitest، Playwright | lint، فرمت، آزمون منطق و مرورگر |
| فایل | S3-compatible object storage | تصاویر محصول و دارایی عمومی |
| auth | Better Auth؛ انتخاب‌شده برای R04 | credentials، session و بازیابی |
| AI | provider adapter؛ سرویس و مدل باز | streaming، ابزار و خروجی ساختاریافته مطابق قابلیت provider |

انتخاب‌های باز: میزبانی، ایمیل، پیامک، درگاه، job queue، rate-limit store و پایش. پیش از نیاز اجرایی در EXECUTION ثبت و با مستندات رسمی بررسی شوند. Redis، Zustand، موتور برداری یا موتور جست‌وجوی جدا پیش‌فرض اجباری نیستند.

هر dependency جدید باید مسئله مشخصی حل کند، سازگاری نسخه و مجوزش بررسی شود و lockfile به‌روز شود. معماری اصلی در [ARCHITECTURE.md](./ARCHITECTURE.md) است.


## سیاست نسخه‌ها — درخواست مالک

همه فناوری‌ها و وابستگی‌ها در زمان نصب باید آخرین نسخه پایدار رسمی باشند؛ beta، RC، canary و experimental پیش‌فرض نیستند. برای Node.js آخرین LTS پشتیبانی‌شده مبناست و PostgreSQL آخرین نسخه پایدار قابل پشتیبانی زیرساخت انتخاب می‌شود. نسخه‌ها از مستندات رسمی و registry بررسی و تاریخ بررسی و نسخه دقیق در EXECUTION ثبت شوند.

اگر آخرین نسخه‌های مستقل با یکدیگر سازگار نبودند، ناسازگاری و گزینه‌ها پیش از انتخاب نسخه قدیمی‌تر به مالک توضیح داده شوند؛ downgrade خاموش انجام نشود. پس از انتخاب، نسخه دقیق و lockfile برای بازتولیدپذیری ثبت می‌شوند. «آخرین نسخه» به معنی dependency شناور یا ارتقای خودکار آزمایش‌نشده نیست؛ ارتقا با تست و بررسی migration انجام می‌شود.

## نسخه‌های نصب‌شده R01 — ۲۰۲۶-۱۰-۳۰

بررسی مستقیم npm registry و مستندات رسمی در روز راه‌اندازی انجام شد. جدول زیر نسخه مستقیم package.json است؛ lockfile تمام وابستگی‌های انتقالی را تثبیت می‌کند. Node محلی 26.13.0 آخرین LTS و pnpm محلی 12.16.1 است.

| بسته | نسخه ثبت‌شده |
| --- | --- |
| @hookform/resolvers | 6.0.2 |
| @radix-ui/react-slot | 1.5.0 |
| @tanstack/react-query | 5.105.0 |
| class-variance-authority | 0.7.1 |
| clsx | 2.1.1 |
| lucide-react | 1.65.0 |
| next | 16.4.3 |
| next-intl | 4.14.9 |
| react | 19.3.1 |
| react-dom | 19.3.1 |
| react-hook-form | 7.91.0 |
| server-only | 0.0.1 |
| tailwind-merge | 3.7.0 |
| zod | 4.6.7 |
| @formatjs/icu-messageformat-parser | 3.5.22 |
| @playwright/test | 1.64.1 |
| @tailwindcss/postcss | 4.3.3 |
| @types/node | 26.6.6 |
| @types/react | 19.3.0 |
| @types/react-dom | 19.3.0 |
| @typescript/native | npm:typescript@7.0.2 |
| oxlint | 1.90.0 |
| prettier | 3.9.10 |
| shadcn | 4.23.0 |
| tailwindcss | 4.3.3 |
| tsx | 4.23.15 |
| tw-animate-css | 1.4.0 |
| typescript | npm:@typescript/typescript6@6.0.2 |
| vite | 8.3.5 |
| vitest | 5.0.5 |
| yaml | 2.9.1 |
## تصمیم سازگاری

اصلاح ThemeProvider: next-themes 0.4.6 به علت رندر inline script در navigation سمت کلاینت با React 19.3.1 حذف شد. Provider محلی script-free، hook useTheme و external async bootstrap تولیدی جای آن را گرفتند؛ هیچ downgrade یا patch در node_modules انجام نشده. regression در هر دو dev و production بررسی شده است. جزئیات در UI و TESTING.

TypeScript 7.0.2 کامپایلر اصلی tsc است و با alias رسمی @typescript/native نصب شده. نام typescript به آخرین بسته رسمی API سازگاری @typescript/typescript6@6.0.2 اشاره می‌کند تا ابزار داخلی Next به API لازم دسترسی داشته باشد؛ build داخلی Next از این API استفاده می‌کند و فرمان مستقل typecheck با tsc7 نیز اجباری است. این استثنا با مالک در گزارش پیشرفت مطرح شد؛ نسخه اصلی پروژه downgrade نشده است.

ESLint 10.13.0 و آخرین typescript-eslint با TS7 و برخی peerهای React/a11y سازگار نبودند؛ lint واقعاً شکست خورد. ابزار lint به Oxlint 1.90.0 با قواعد TypeScript، React/hooks، Next، import و jsx-a11y منتقل شد؛ Prettier باقی است. هیچ peer conflict با ignore یا خاموش کردن typecheck پنهان نشده است.

برچسب latest در prisma به 8.0.0-rc.28 اشاره داشت؛ آخرین stable مشاهده‌شده Prisma و Client برابر 7.10.1 است. Prisma فعلاً نصب نشده و در R03 دوباره آخرین stable بررسی خواهد شد. Better Auth 1.7.14 مشاهده و برای R04 انتخاب شد؛ تا آن مرحله نصب/ورود فعال نیست.

منابع رسمی: [Next installation](https://nextjs.org/docs/app/getting-started/installation)، [next-intl routing](https://next-intl.dev/docs/routing/setup)، [TanStack SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)، [TypeScript side-by-side](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)، [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)، [Better Auth](https://better-auth.com/docs/installation)، [Node releases](https://nodejs.org/dist/index.json)، [npm registry](https://registry.npmjs.org/).

workflow از releaseهای رسمی checkout 7.0.1، setup-node 7.1.0، upload-artifact 7.0.2 و pnpm/action-setup 6.1.0 استفاده می‌کند. اجرای ابری هنوز انجام نشده است.

## افزوده‌های R02

@fontsource/vazirmatn نسخه 5.3.0 (آخرین stable بررسی‌شده در registry)، import محلی CSS با مجوز OFL؛ @axe-core/playwright نسخه 4.14.0 برای آزمون WCAG خودکار. نسخه‌ها exact و در lockfile هستند. در بازنگری جدید به درخواست مالک، GSAP و ScrollTrigger جایگزین حرکت اولیه شدند.


## حرکت در بازنگری R02

GSAP 3.15.0 و @gsap/react 2.1.2 از registry رسمی بررسی، exact نصب و در lockfile ثبت شدند. ScrollTrigger از خود gsap است؛ useGSAP و matchMedia برای scope، cleanup و reduced-motion استفاده می‌شوند.

منابع: [React integration](https://gsap.com/resources/React/)، [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)، [matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/).


Lenis 1.3.27 برای درخواست صریح اسکرول نرم نصب و exact lock شد. اتصال ticker مشترک، cleanup و reduced-motion در UI ثبت است. [مرجع رسمی](https://github.com/darkroomengineering/lenis).
