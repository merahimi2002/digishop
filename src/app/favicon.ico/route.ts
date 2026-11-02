/** Browsers may request the conventional icon even when SVG metadata is present. */
export function GET() {
  return new Response(null, {
    status: 307,
    headers: { Location: '/brand/mark.svg', 'Cache-Control': 'public, max-age=3600' },
  });
}
