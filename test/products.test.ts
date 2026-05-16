import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { createCreateProductHandler } from '../src/lambdas/createProduct';
import { createGetProductsByIdHandler } from '../src/lambdas/getProductsById';
import { createGetProductsListHandler } from '../src/lambdas/getProductsList';
import type { ProductRecord, StockRecord } from '../src/models/product';
import type { ProductsRepository } from '../src/services/productService';

const productId = '7567ec4b-b10c-48c5-9345-fc73c48a80aa';
const products: ProductRecord[] = [
  {
    id: productId,
    title: 'Cloud Native Backpack',
    description: 'Durable daypack with a laptop sleeve and weather-resistant shell.',
    price: 79,
  },
];
const stocks: StockRecord[] = [
  {
    product_id: productId,
    count: 12,
  },
];

const createRepository = (): ProductsRepository => ({
  async getProducts() {
    return products;
  },
  async getStocks() {
    return stocks;
  },
  async getProductById(id: string) {
    return products.find((product) => product.id === id);
  },
  async getStockByProductId(id: string) {
    return stocks.find((stock) => stock.product_id === id);
  },
  async createProduct(product: ProductRecord, stock: StockRecord) {
    products.push(product);
    stocks.push(stock);
  },
});

const createFailingRepository = (): ProductsRepository => ({
  async getProducts() {
    throw new Error('DB connection failed');
  },
  async getStocks() {
    throw new Error('DB connection failed');
  },
  async getProductById() {
    throw new Error('DB connection failed');
  },
  async getStockByProductId() {
    throw new Error('DB connection failed');
  },
  async createProduct() {
    throw new Error('DB connection failed');
  },
});

const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}) => ({
  body: null,
  path: '/products',
  pathParameters: null,
  queryStringParameters: null,
  ...overrides,
}) as APIGatewayProxyEvent;

const invoke = async (handler: APIGatewayProxyHandler, event: APIGatewayProxyEvent) => {
  const response = await handler(event, null as never, null as never);

  return response as APIGatewayProxyResult;
};

test('getProductsList returns products joined with stocks', async () => {
  const response = await invoke(createGetProductsListHandler(createRepository()), mockEvent());
  const result = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(result, [
    {
      ...products[0],
      count: 12,
    },
  ]);
});

test('getProductsById returns product by id joined with stock', async () => {
  const response = await invoke(
    createGetProductsByIdHandler(createRepository()),
    mockEvent({
      path: `/products/${productId}`,
      pathParameters: { productId },
    }),
  );
  const result = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(result.id, productId);
  assert.equal(result.count, 12);
});

test('getProductsById returns 404 for unknown product', async () => {
  const response = await invoke(
    createGetProductsByIdHandler(createRepository()),
    mockEvent({
      path: '/products/missing-product',
      pathParameters: { productId: 'missing-product' },
    }),
  );

  assert.equal(response.statusCode, 404);
});

test('createProduct returns created product', async () => {
  const id = '19ba3d6a-f8ed-491b-a192-0a33b71b38c4';
  const response = await invoke(
    createCreateProductHandler(createRepository()),
    mockEvent({
      body: JSON.stringify({
        id,
        title: 'New Product',
        description: 'Fresh catalog item',
        price: 200,
        count: 2,
      }),
    }),
  );
  const result = JSON.parse(response.body);

  assert.equal(response.statusCode, 201);
  assert.deepEqual(result, {
    id,
    title: 'New Product',
    description: 'Fresh catalog item',
    price: 200,
    count: 2,
  });
});

test('createProduct returns 400 for invalid product data', async () => {
  const response = await invoke(
    createCreateProductHandler(createRepository()),
    mockEvent({
      body: JSON.stringify({
        title: '',
        price: -1,
        count: 2,
      }),
    }),
  );

  assert.equal(response.statusCode, 400);
});

test('handlers return 500 on unhandled errors', async () => {
  const response = await invoke(createGetProductsListHandler(createFailingRepository()), mockEvent());

  assert.equal(response.statusCode, 500);
});
