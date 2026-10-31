import { accountRoute } from '@/server/auth/routes';
export const runtime = 'nodejs';
export const GET = (request: Request) => accountRoute(request, 'admin');
