import createMiddleware from 'next-intl/middleware';
import { hasLocale } from 'next-intl';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { getConceptProduct } from '@/lib/concept-products';
import { getDatabase } from '@/server/database/client';
import { resolveStoreProductRoute } from '@/server/catalog/storefront';

const handleI18n = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.split('/')[1];
  const [, locale, resource, encodedSlug, previewSlug] = request.nextUrl.pathname.split('/');
  let slug: string;
  try {
    slug = decodeURIComponent(encodedSlug ?? '');
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  // Resolve visibility before the loading boundary streams a 200 response.
  if (hasLocale(routing.locales, locale) && resource === 'products' && slug) {
    const resolved =
      slug.length <= 180 ? await resolveStoreProductRoute(getDatabase(), locale, slug) : null;
    if (!resolved)
      return NextResponse.rewrite(new URL(`/${locale}/not-found-product`, request.url), {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      });
    if (resolved !== slug) {
      const target = request.nextUrl.clone();
      target.pathname = `/${locale}/products/${resolved}`;
      return NextResponse.redirect(target, {
        status: 307,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  }
  // Keep the finite R02 design routes separate from the live catalog.
  if (
    hasLocale(routing.locales, locale) &&
    resource === 'preview' &&
    encodedSlug === 'products' &&
    previewSlug &&
    !getConceptProduct(previewSlug)
  ) {
    return NextResponse.rewrite(new URL(`/${locale}/not-found-product`, request.url), {
      status: 404,
    });
  }
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
