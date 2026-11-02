import 'server-only';
import { serverEnv } from '../env';
import { getDatabase } from '../database/client';
import { getAuth } from '../auth';
import { privateJson } from '../auth/http';
import { createCatalogHandler } from './http';
export function catalogRoute(request: Request, resource: string) {
  if (!serverEnv.AUTH_ENABLED) return privateJson({ error: 'AUTH_DISABLED' }, 503);
  return createCatalogHandler(getDatabase(), getAuth(), serverEnv)(request, resource);
}
