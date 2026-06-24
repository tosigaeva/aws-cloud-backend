import { randomUUID } from 'crypto';
import type { CreateProductRequest, Product, ProductRecord, StockRecord } from '../models/product';

export type ProductsRepository = {
  getProducts: () => Promise<ProductRecord[]>;
  getStocks: () => Promise<StockRecord[]>;
  getProductById: (id: string) => Promise<ProductRecord | undefined>;
  getStockByProductId: (productId: string) => Promise<StockRecord | undefined>;
  createProduct: (product: ProductRecord, stock: StockRecord) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const joinProductWithStock = (
  product: ProductRecord,
  stocksByProductId: Map<string, StockRecord>,
): Product => ({
  ...product,
  count: stocksByProductId.get(product.id)?.count ?? 0,
});

export const getProductsList = async (repository: ProductsRepository): Promise<Product[]> => {
  const [products, stocks] = await Promise.all([
    repository.getProducts(),
    repository.getStocks(),
  ]);
  const stocksByProductId = new Map(stocks.map((stock) => [stock.product_id, stock]));

  return products.map((product) => joinProductWithStock(product, stocksByProductId));
};

export const getProductById = async (
  repository: ProductsRepository,
  productId: string,
): Promise<Product | undefined> => {
  const [product, stock] = await Promise.all([
    repository.getProductById(productId),
    repository.getStockByProductId(productId),
  ]);

  if (!product) {
    return undefined;
  }

  return {
    ...product,
    count: stock?.count ?? 0,
  };
};

export const parseCreateProductRequest = (request: CreateProductRequest): Product => {
  const title = typeof request.title === 'string' ? request.title.trim() : '';
  const description = typeof request.description === 'string' ? request.description.trim() : '';
  const imageUrl = typeof request.imageUrl === 'string' ? request.imageUrl.trim() : '';
  const price = Number(request.price);
  const count = Number(request.count);
  const id = typeof request.id === 'string' && request.id.trim() ? request.id.trim() : randomUUID();

  if (!title) {
    throw new ValidationError('Product title is required');
  }

  if (!Number.isInteger(price) || price < 0) {
    throw new ValidationError('Product price must be a non-negative integer');
  }

  if (!Number.isInteger(count) || count < 0) {
    throw new ValidationError('Product count must be a non-negative integer');
  }

  return {
    id,
    title,
    description,
    imageUrl,
    price,
    count,
  };
};

export const createProduct = async (
  repository: ProductsRepository,
  request: CreateProductRequest,
): Promise<Product> => {
  const product = parseCreateProductRequest(request);

  await repository.createProduct(
    {
      id: product.id,
      title: product.title,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
    },
    {
      product_id: product.id,
      count: product.count,
    },
  );

  return product;
};

export const deleteProduct = async (
  repository: ProductsRepository,
  productId: string,
): Promise<void> => {
  const normalizedProductId = productId.trim();

  if (!normalizedProductId) {
    throw new ValidationError('Product id is required');
  }

  await repository.deleteProduct(normalizedProductId);
};
