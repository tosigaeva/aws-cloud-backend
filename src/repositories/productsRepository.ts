import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { ProductRecord, StockRecord } from '../models/product';
import type { ProductsRepository } from '../services/productService';

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
};

export const createProductsRepository = (): ProductsRepository => {
  const productsTableName = getRequiredEnv('PRODUCTS_TABLE_NAME');
  const stocksTableName = getRequiredEnv('STOCKS_TABLE_NAME');

  return {
    async getProducts() {
      const result = await dynamoDb.send(new ScanCommand({ TableName: productsTableName }));

      return (result.Items ?? []) as ProductRecord[];
    },

    async getStocks() {
      const result = await dynamoDb.send(new ScanCommand({ TableName: stocksTableName }));

      return (result.Items ?? []) as StockRecord[];
    },

    async getProductById(id: string) {
      const result = await dynamoDb.send(new GetCommand({
        TableName: productsTableName,
        Key: { id },
      }));

      return result.Item as ProductRecord | undefined;
    },

    async getStockByProductId(productId: string) {
      const result = await dynamoDb.send(new GetCommand({
        TableName: stocksTableName,
        Key: { product_id: productId },
      }));

      return result.Item as StockRecord | undefined;
    },

    async createProduct(product: ProductRecord, stock: StockRecord) {
      await dynamoDb.send(new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: product,
              ConditionExpression: 'attribute_not_exists(id)',
            },
          },
          {
            Put: {
              TableName: stocksTableName,
              Item: stock,
              ConditionExpression: 'attribute_not_exists(product_id)',
            },
          },
        ],
      }));
    },
  };
};
