import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { createCatalogBatchProcessHandler } from '../src/lambdas/catalogBatchProcess';
import type { Product } from '../src/models/product';
import type { ProductNotificationPublisher } from '../src/services/notificationService';
import type { ProductRecord, StockRecord } from '../src/models/product';
import type { ProductsRepository } from '../src/services/productService';

const sqsEvent = (bodies: unknown[]): SQSEvent => ({
  Records: bodies.map((body, index) => ({
    messageId: `message-${index}`,
    receiptHandle: `receipt-${index}`,
    body: JSON.stringify(body),
    attributes: {
      ApproximateReceiveCount: '1',
      SentTimestamp: '1',
      SenderId: 'sender',
      ApproximateFirstReceiveTimestamp: '1',
    },
    messageAttributes: {},
    md5OfBody: 'md5',
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:eu-central-1:123456789012:catalogItemsQueue',
    awsRegion: 'eu-central-1',
  })),
});

test('catalogBatchProcess creates products and publishes notification', async () => {
  const createdProducts: ProductRecord[] = [];
  const createdStocks: StockRecord[] = [];
  const notifications: Product[][] = [];
  const repository: ProductsRepository = {
    async getProducts() {
      return [];
    },
    async getStocks() {
      return [];
    },
    async getProductById() {
      return undefined;
    },
    async getStockByProductId() {
      return undefined;
    },
    async createProduct(product, stock) {
      createdProducts.push(product);
      createdStocks.push(stock);
    },
  };
  const publisher: ProductNotificationPublisher = {
    async publishProductsCreated(products) {
      notifications.push(products);
    },
  };
  const handler = createCatalogBatchProcessHandler(repository, publisher);

  await handler(sqsEvent([
    {
      id: '19ba3d6a-f8ed-491b-a192-0a33b71b38c4',
      title: 'Imported product',
      description: 'From CSV',
      price: '200',
      count: '2',
    },
  ]), null as never, null as never) as SQSBatchResponse | void;

  assert.deepEqual(createdProducts, [
    {
      id: '19ba3d6a-f8ed-491b-a192-0a33b71b38c4',
      title: 'Imported product',
      description: 'From CSV',
      price: 200,
    },
  ]);
  assert.deepEqual(createdStocks, [
    {
      product_id: '19ba3d6a-f8ed-491b-a192-0a33b71b38c4',
      count: 2,
    },
  ]);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].length, 1);
});
