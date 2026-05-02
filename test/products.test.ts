import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { handler as getProductsList } from '../src/lambdas/getProductsList';
import { handler as getProductsById } from '../src/lambdas/getProductsById';

const mockEvent = (productId?: string) => ({
  pathParameters: productId ? { productId } : null,
}) as APIGatewayProxyEvent;

const invoke = async (handler: APIGatewayProxyHandler, event: APIGatewayProxyEvent) => {
  const response = await handler(event, null as never, null as never);

  return response as APIGatewayProxyResult;
};

test('getProductsList returns all products', async () => {
  const response = await invoke(getProductsList, mockEvent());
  const products = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(Array.isArray(products), true);
  assert.equal(products.length > 0, true);
});

test('getProductsById returns product by id', async () => {
  const productId = '7567ec4b-b10c-48c5-9345-fc73c48a80aa';
  const response = await invoke(getProductsById, mockEvent(productId));
  const product = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(product.id, productId);
});

test('getProductsById returns 404 for unknown product', async () => {
  const response = await invoke(getProductsById, mockEvent('missing-product'));

  assert.equal(response.statusCode, 404);
});
