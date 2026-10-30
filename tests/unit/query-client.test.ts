import { describe, expect, it } from 'vitest';
import { clearPrivateQueries, makeQueryClient, queryKeys } from '../../src/lib/query-client';

describe('query isolation', () => {
  it('does not share private cache across factory instances', () => {
    const a = makeQueryClient();
    const b = makeQueryClient();
    const key = queryKeys.private('a', 'fa', 'orders');
    a.setQueryData(key, ['order-a']);
    expect(b.getQueryData(key)).toBeUndefined();
    a.clear();
    b.clear();
  });
  it('scopes locale and account keys and clears only private data at logout', async () => {
    const client = makeQueryClient();
    const privateKey = queryKeys.private('a', 'fa', 'orders');
    const publicKey = queryKeys.public('en', 'products');
    client.setQueryData(privateKey, ['private']);
    client.setQueryData(publicKey, ['public']);
    await clearPrivateQueries(client);
    expect(client.getQueryData(privateKey)).toBeUndefined();
    expect(client.getQueryData(publicKey)).toEqual(['public']);
    expect(queryKeys.private('a', 'fa', 'orders')).not.toEqual(
      queryKeys.private('b', 'fa', 'orders'),
    );
    expect(queryKeys.public('fa', 'products')).not.toEqual(publicKey);
    client.clear();
  });
});
