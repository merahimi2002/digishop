import 'server-only';
import { headers } from 'next/headers';
import { serverEnv } from '../env';
import { getDatabase } from '../database/client';
import { getAuth } from './index';
import { readPrincipal } from './factory';
export async function currentPrincipal() {
  return serverEnv.AUTH_ENABLED ? readPrincipal(getAuth(), getDatabase(), await headers()) : null;
}
