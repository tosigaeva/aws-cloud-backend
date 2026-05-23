import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

export type CatalogItemsQueue = {
  sendCatalogItem: (record: Record<string, string>) => Promise<void>;
};

const sqsClient = new SQSClient({});

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
};

export const createSqsCatalogItemsQueue = (): CatalogItemsQueue => {
  const queueUrl = getRequiredEnv('CATALOG_ITEMS_QUEUE_URL');

  return {
    async sendCatalogItem(record: Record<string, string>) {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(record),
      }));
    },
  };
};
