export type AccountData = {
  user: null | {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
  };
  sessions?: { id: string; createdAt: string; expiresAt: string; current: boolean }[];
  expiresAt?: string;
};
export const accountKey = ['private', 'account'] as const;
export async function getAccount(): Promise<AccountData> {
  const response = await fetch('/api/account', { cache: 'no-store' });
  if (!response.ok) throw new Error('ACCOUNT_UNAVAILABLE');
  return response.json() as Promise<AccountData>;
}
export async function accountAction(path: string, body: unknown, locale: string, method = 'POST') {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-digishop-locale': locale },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? 'RATE_LIMITED'
        : response.status === 401
          ? 'SESSION_EXPIRED'
          : 'AUTH_FAILED',
    );
}
