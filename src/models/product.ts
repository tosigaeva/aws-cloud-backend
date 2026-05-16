export type ProductRecord = {
  id: string;
  title: string;
  description?: string;
  price: number;
};

export type StockRecord = {
  product_id: string;
  count: number;
};

export type Product = ProductRecord & {
  count: number;
};

export type CreateProductRequest = {
  id?: string;
  title?: unknown;
  description?: unknown;
  price?: unknown;
  count?: unknown;
};
