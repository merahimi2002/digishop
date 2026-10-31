import { createHash } from 'node:crypto';
import { z } from 'zod';
export { emailInput, passwordInput, nameInput } from '../../lib/auth-input';
export const tokenInput = z.string().min(20).max(4096);
export function tokenDigest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
export type Permission =
  'account:read' | 'account:update' | 'catalog:write' | 'orders:read' | 'roles:manage';
export function can(role: string, permission: Permission) {
  if (role === 'OWNER') return true;
  if (role === 'ADMIN') return permission !== 'roles:manage';
  return role === 'CUSTOMER' && (permission === 'account:read' || permission === 'account:update');
}
