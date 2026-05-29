import type { SQSHandler } from 'aws-lambda';
import { createProductNotificationPublisher } from '../../repositories/productNotificationPublisher';
import { createProductsRepository } from '../../repositories/productsRepository';
import { processCatalogBatch } from '../../services/catalogBatchProcess';
import type { ProductNotificationPublisher } from '../../services/notificationService';
import type { ProductsRepository } from '../../services/productService';

export const createCatalogBatchProcessHandler = (
  productRepository: ProductsRepository,
  notificationPublisher: ProductNotificationPublisher,
): SQSHandler => async (event) => {
  console.log('catalogBatchProcess request received', {
    recordsCount: event.Records.length,
    messageIds: event.Records.map((record) => record.messageId),
  });

  await processCatalogBatch(
    productRepository,
    notificationPublisher,
    event.Records.map((record) => record.body),
  );
};

export const handler: SQSHandler = (event, context, callback) => (
  createCatalogBatchProcessHandler(
    createProductsRepository(),
    createProductNotificationPublisher(),
  )(event, context, callback)
);
