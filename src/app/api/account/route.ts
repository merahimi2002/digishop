import { accountRoute } from '@/server/auth/routes';
export const runtime = 'nodejs';
export const GET = (request: Request) => accountRoute(request);
export const PATCH = (request: Request) => accountRoute(request);
