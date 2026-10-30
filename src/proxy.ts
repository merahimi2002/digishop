import createMiddleware from 'next-intl/middleware';
import { hasLocale } from 'next-intl';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const handleI18n = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.split('/')[1];
  if (request.nextUrl.pathname === '/') {
    const saved = request.cookies.get('NEXT_LOCALE')?.value;
    const locale = hasLocale(routing.locales, saved) ? saved : routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }
  if (segment && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(segment) && !hasLocale(routing.locales, segment)) {
    return NextResponse.rewrite(
      new URL(`/${routing.defaultLocale}/not-found-locale`, request.url),
      { status: 404 },
    );
  }
  return handleI18n(request);
}

export const config = { matcher: ['/((?!api|_next|brand|.*\\..*).*)'] };
