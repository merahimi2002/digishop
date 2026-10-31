import 'server-only';
import { serverEnv } from '../env';
import { getDatabase } from '../database/client';
import { getAuth } from './index';
import { createAuthHandler, createAccountHandler, privateJson } from './http';
export function authRoute(request: Request) {
  if (!serverEnv.AUTH_ENABLED) return privateJson({ error: 'AUTH_DISABLED' }, 503);
  return createAuthHandler(getAuth(), getDatabase(), serverEnv)(request);
}
export function accountRoute(request: Request, kind: 'account' | 'sessions' | 'admin' = 'account') {
  if (!serverEnv.AUTH_ENABLED) return privateJson({ user: null }, kind === 'account' ? 200 : 503);
  return createAccountHandler(getAuth(), getDatabase(), serverEnv, kind)(request);
}
