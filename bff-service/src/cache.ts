type CachedResponse = {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
  expiresAt: number;
};

const PRODUCTS_LIST_CACHE_TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, CachedResponse>();

export function isProductsListCacheableRequest(method: string, recipientName: string, upstreamUrl: URL): boolean {
  return method === 'GET' && recipientName === 'product' && upstreamUrl.pathname.endsWith('/products');
}

export function getCachedResponse(cacheKey: string): CachedResponse | undefined {
  const cachedResponse = cache.get(cacheKey);

  if (!cachedResponse) {
    return undefined;
  }

  if (cachedResponse.expiresAt <= Date.now()) {
    cache.delete(cacheKey);
    return undefined;
  }

  return cachedResponse;
}

export function setCachedResponse(
  cacheKey: string,
  response: Omit<CachedResponse, 'expiresAt'>,
  ttlMs = PRODUCTS_LIST_CACHE_TTL_MS,
): void {
  cache.set(cacheKey, {
    ...response,
    expiresAt: Date.now() + ttlMs,
  });
}
