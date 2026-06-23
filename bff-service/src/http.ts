import { IncomingMessage, ServerResponse } from 'node:http';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type,Authorization',
  });
  response.end(JSON.stringify(payload));
}

export function sendCorsPreflight(response: ServerResponse): void {
  response.writeHead(204, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type,Authorization',
  });
  response.end();
}

export function readRequestBody(request: IncomingMessage): Promise<ArrayBuffer | undefined> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('error', reject);
    request.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }

      const body = Buffer.concat(chunks);
      resolve(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength));
    });
  });
}

export function copyRequestHeaders(request: IncomingMessage, excludedHeaders: string[] = []): Headers {
  const headers = new Headers();
  const excludedHeaderSet = new Set(excludedHeaders.map((header) => header.toLowerCase()));

  Object.entries(request.headers).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(normalizedKey) || excludedHeaderSet.has(normalizedKey) || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
      return;
    }

    headers.set(key, value);
  });

  return headers;
}

export function copyResponseHeaders(upstreamResponse: Response): Record<string, string> {
  const headers: Record<string, string> = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type,Authorization',
  };

  upstreamResponse.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  return headers;
}
