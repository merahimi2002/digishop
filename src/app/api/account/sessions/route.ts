import { accountRoute } from '@/server/auth/routes';
export const runtime = 'nodejs';
export const GET = (request: Request) => accountRoute(request, 'sessions');
export const DELETE = (request: Request) => accountRoute(request, 'sessions');
