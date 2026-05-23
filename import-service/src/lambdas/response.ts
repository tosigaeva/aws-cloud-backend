export const textResponse = (statusCode: number, body: string) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain',
  },
  body,
});

export const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});
