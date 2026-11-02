import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import type { AuthEnvironment } from '../auth/mail';
import { readPrincipal, type Auth } from '../auth/factory';
import { bodyJson, privateJson, sameOrigin, consumeLimit } from '../auth/http';
import { can } from '../auth/policy';
import { catalogInput, catalogResource } from '../../lib/catalog-input';
import { listCatalog, mutateCatalog, catalogFailure } from './service';
import { productInput } from '../../lib/product-input';
import { listProducts, saveProduct } from './products';
export function createCatalogHandler(db: PrismaClient, auth: Auth, env: AuthEnvironment) {
  return async (request: Request, resourceName: string) => {
    const resource = catalogResource.safeParse(resourceName);
    const products = resourceName === 'products';
    if (!resource.success && !products) return privateJson({ error: 'NOT_FOUND' }, 404);
    if (request.method !== 'GET' && !sameOrigin(request, env.APP_ORIGIN))
      return privateJson({ error: 'FORBIDDEN' }, 403);
    const principal = await readPrincipal(auth, db, request.headers);
    if (!principal) return privateJson({ error: 'UNAUTHORIZED' }, 401);
    if (!can(principal.user.role, 'catalog:write') || principal.user.mustChangePassword)
      return privateJson({ error: 'FORBIDDEN' }, 403);
    try {
      if (request.method === 'GET') {
        const url = new URL(request.url);
        const query = z
          .object({
            page: z.coerce.number().int().min(1).max(10000).default(1),
            q: z.string().trim().max(100).default(''),
          })
          .parse(Object.fromEntries(url.searchParams));
        return privateJson(
          products
            ? await listProducts(db, query.page, query.q)
            : await listCatalog(db, resource.data!, query.page, query.q),
        );
      }
      if (!['POST', 'PATCH', 'DELETE'].includes(request.method))
        return privateJson({ error: 'NOT_FOUND' }, 404);
      if (products && request.method === 'DELETE')
        return privateJson({ error: 'ARCHIVE_REQUIRED' }, 405);
      if (!(await consumeLimit(db, 'catalog:' + principal.user.id, 60, 60)))
        return privateJson({ error: 'RATE_LIMITED' }, 429);
      let input: unknown;
      try {
        input = await bodyJson(request, products ? 262144 : 65536);
      } catch {
        return privateJson({ error: 'INVALID_INPUT' }, 400);
      }
      const update =
        request.method !== 'POST'
          ? z.object({ id: z.uuid(), revision: z.string().regex(/^[a-f0-9]{64}$/) }).parse(input)
          : undefined;
      if (products) {
        const item = await saveProduct(
          db,
          principal.user.id,
          productInput.parse(input),
          update?.id,
          update?.revision,
        );
        return privateJson({ item }, request.method === 'POST' ? 201 : 200);
      }
      const value = request.method === 'DELETE' ? null : catalogInput.parse(input);
      const item = await mutateCatalog(
        db,
        resource.data!,
        principal.user.id,
        request.method === 'POST' ? 'create' : request.method === 'PATCH' ? 'update' : 'delete',
        value,
        update?.id,
        update?.revision,
      );
      return privateJson({ item }, request.method === 'POST' ? 201 : 200);
    } catch (error) {
      if (error instanceof z.ZodError) return privateJson({ error: 'INVALID_INPUT' }, 400);
      const failure = catalogFailure(error);
      return privateJson({ error: failure.error }, failure.status);
    }
  };
}
