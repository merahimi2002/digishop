import { QueryClient } from '@tanstack/react-query';

// Factory only: never share a server-side QueryClient across requests/users.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export const queryKeys = {
  public: (locale: string, resource: string) => ['public', locale, resource] as const,
  private: (userId: string, locale: string, resource: string) =>
    ['private', userId, locale, resource] as const,
};

export async function clearPrivateQueries(client: QueryClient) {
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === 'private',
  };
  await client.cancelQueries(filters);
  client.removeQueries(filters);
}
