import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { products } from '../src/data/products';

const productsTableName = process.env.PRODUCTS_TABLE_NAME ?? 'products';
const stocksTableName = process.env.STOCKS_TABLE_NAME ?? 'stocks';
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const seed = async () => {
  const productRequests = products.map(({ count, ...product }) => ({
    PutRequest: {
      Item: product,
    },
  }));
  const stockRequests = products.map(({ id, count }) => ({
    PutRequest: {
      Item: {
        product_id: id,
        count,
      },
    },
  }));

  await dynamoDb.send(new BatchWriteCommand({
    RequestItems: {
      [productsTableName]: productRequests,
      [stocksTableName]: stockRequests,
    },
  }));

  console.log(`Seeded ${productRequests.length} products into ${productsTableName}`);
  console.log(`Seeded ${stockRequests.length} stock records into ${stocksTableName}`);
};

seed().catch((error) => {
  console.error('Seed failed', error);
  process.exitCode = 1;
});
