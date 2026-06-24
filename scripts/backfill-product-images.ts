import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const productsTableName = process.env.PRODUCTS_TABLE_NAME ?? 'products';
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const imageUrls = [
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
];

const getImageUrl = (title: string, index: number) => {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('backpack') || normalizedTitle.includes('bag') || normalizedTitle.includes('tote')) {
    return imageUrls[0];
  }

  if (normalizedTitle.includes('lamp')) {
    return imageUrls[1];
  }

  if (normalizedTitle.includes('mug') || normalizedTitle.includes('coffee')) {
    return imageUrls[2];
  }

  if (normalizedTitle.includes('notebook')) {
    return imageUrls[3];
  }

  if (normalizedTitle.includes('hoodie')) {
    return imageUrls[4];
  }

  return imageUrls[index % imageUrls.length];
};

const backfill = async () => {
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  let processedCount = 0;
  let updatedCount = 0;

  do {
    const result = await dynamoDb.send(new ScanCommand({
      TableName: productsTableName,
      ProjectionExpression: 'id, title, imageUrl',
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    const items = result.Items ?? [];

    for (const item of items) {
      processedCount += 1;

      if (typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.imageUrl === 'string') {
        continue;
      }

      await dynamoDb.send(new UpdateCommand({
        TableName: productsTableName,
        Key: { id: item.id },
        UpdateExpression: 'SET imageUrl = :imageUrl',
        ExpressionAttributeValues: {
          ':imageUrl': getImageUrl(item.title, processedCount),
        },
      }));

      updatedCount += 1;
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Processed ${processedCount} products in ${productsTableName}`);
  console.log(`Backfilled imageUrl for ${updatedCount} products`);
};

backfill().catch((error) => {
  console.error('Backfill failed', error);
  process.exitCode = 1;
});
