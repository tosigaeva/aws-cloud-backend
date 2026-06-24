import { IncomingMessage, ServerResponse } from 'node:http';
import {
  clearProductsListCache,
  getCachedResponse,
  isProductsListCacheableRequest,
  setCachedResponse,
} from './cache';
import { copyRequestHeaders, copyResponseHeaders, readRequestBody, sendJson } from './http';
import { BffConfig, getRecipientUrl } from './config';

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);

type ParsedProxyRequest = {
  recipientName: string;
  upstreamUrl: URL;
};

function parseProxyRequest(request: IncomingMessage, config: BffConfig): ParsedProxyRequest | undefined {
  const requestUrl = new URL(request.url || '/', 'http://localhost');
  const [recipientName, ...pathParts] = requestUrl.pathname.split('/').filter(Boolean);

  if (!recipientName || (config.allowedRecipients.size > 0 && !config.allowedRecipients.has(recipientName))) {
    return undefined;
  }

  const recipientBaseUrl = getRecipientUrl(recipientName);

  if (!recipientBaseUrl) {
    return undefined;
  }

  const upstreamUrl = new URL(recipientBaseUrl);
  const basePath = upstreamUrl.pathname.replace(/\/$/, '');
  const forwardedPath = pathParts.map(encodeURIComponent).join('/');

  upstreamUrl.pathname = [basePath, forwardedPath].filter(Boolean).join('/');
  upstreamUrl.search = requestUrl.search;

  return {
    recipientName,
    upstreamUrl,
  };
}

export async function handleProxyRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: BffConfig,
): Promise<void> {
  const parsedRequest = parseProxyRequest(request, config);

  if (!parsedRequest) {
    sendJson(response, 502, { message: 'Cannot process request' });
    return;
  }

  const method = request.method || 'GET';
  const cacheKey = `${method}:${parsedRequest.upstreamUrl.toString()}`;
  const shouldUseCache = isProductsListCacheableRequest(method, parsedRequest.recipientName, parsedRequest.upstreamUrl);
  const cachedResponse = shouldUseCache ? getCachedResponse(cacheKey) : undefined;

  if (cachedResponse) {
    response.writeHead(cachedResponse.status, cachedResponse.headers);
    response.end(cachedResponse.body);
    return;
  }

  const requestBody = METHODS_WITHOUT_BODY.has(method) ? undefined : await readRequestBody(request);

  try {
    const excludedHeaders = parsedRequest.recipientName === 'product' ? ['authorization'] : [];
    const upstreamResponse = await fetch(parsedRequest.upstreamUrl, {
      method,
      headers: copyRequestHeaders(request, excludedHeaders),
      body: requestBody,
    });

    const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
    const responseHeaders = copyResponseHeaders(upstreamResponse);

    if (shouldUseCache && upstreamResponse.ok) {
      setCachedResponse(cacheKey, {
        status: upstreamResponse.status,
        headers: responseHeaders,
        body: responseBody,
      });
    }

    if (parsedRequest.recipientName === 'product' && method !== 'GET' && upstreamResponse.ok) {
      clearProductsListCache();
    }

    response.writeHead(upstreamResponse.status, responseHeaders);
    response.end(responseBody);
  } catch (error) {
    console.error('BFF proxy request failed', {
      recipientName: parsedRequest.recipientName,
      upstreamUrl: parsedRequest.upstreamUrl.toString(),
      method,
      error,
    });

    sendJson(response, 502, { message: 'Cannot process request' });
  }
}
