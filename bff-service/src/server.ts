import { createServer } from 'node:http';
import { getConfig } from './config';
import { sendCorsPreflight, sendJson } from './http';
import { handleProxyRequest } from './proxy';

const config = getConfig();

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendCorsPreflight(response);
    return;
  }

  if (request.url === '/' || request.url === '/ping') {
    sendJson(response, 200, { statusCode: 200, message: 'OK' });
    return;
  }

  await handleProxyRequest(request, response, config);
});

server.listen(config.port, () => {
  console.log(`BFF Service is running on ${config.port} port`);
});
