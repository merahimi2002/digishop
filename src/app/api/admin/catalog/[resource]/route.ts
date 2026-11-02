import { catalogRoute } from '@/server/catalog/routes';
export const runtime = 'nodejs';
async function handle(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  return catalogRoute(request, (await params).resource);
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
