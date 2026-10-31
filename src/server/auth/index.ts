import 'server-only';
import { createAuth } from './factory';
import { getDatabase } from '../database/client';
import { serverEnv } from '../env';
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  if (!serverEnv.AUTH_ENABLED) throw new Error('Authentication is disabled');
  return (auth ??= createAuth(getDatabase(), serverEnv));
}
