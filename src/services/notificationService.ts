import type { Product } from '../models/product';

export type ProductNotificationPublisher = {
  publishProductsCreated: (products: Product[]) => Promise<void>;
};

export const getPriceCategory = (product: Product) => (
  product.price >= 100 ? 'expensive' : 'regular'
);
