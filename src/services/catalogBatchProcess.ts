import type { CreateProductRequest, Product } from '../models/product';
import { createProduct } from './productService';
import type { ProductsRepository } from './productService';
import type { ProductNotificationPublisher } from './notificationService';

export const parseCatalogItem = (body: string): CreateProductRequest => JSON.parse(body);

export const processCatalogBatch = async (
  productRepository: ProductsRepository,
  notificationPublisher: ProductNotificationPublisher,
  messages: string[],
) => {
  const createdProducts: Product[] = [];

  for (const message of messages) {
    const product = await createProduct(productRepository, parseCatalogItem(message));
    createdProducts.push(product);
  }

  if (createdProducts.length > 0) {
    await notificationPublisher.publishProductsCreated(createdProducts);
  }

  return createdProducts;
};
