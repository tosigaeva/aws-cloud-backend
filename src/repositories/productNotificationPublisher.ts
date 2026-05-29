import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import type { Product } from '../models/product';
import { getPriceCategory } from '../services/notificationService';
import type { ProductNotificationPublisher } from '../services/notificationService';

const snsClient = new SNSClient({});

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
};

export const createProductNotificationPublisher = (): ProductNotificationPublisher => {
  const topicArn = getRequiredEnv('CREATE_PRODUCT_TOPIC_ARN');

  return {
    async publishProductsCreated(products: Product[]) {
      await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: 'Products were imported',
        Message: JSON.stringify({
          message: `${products.length} product(s) were created`,
          products,
        }),
        MessageAttributes: {
          priceCategory: {
            DataType: 'String',
            StringValue: products.some((product) => getPriceCategory(product) === 'expensive')
              ? 'expensive'
              : 'regular',
          },
        },
      }));
    },
  };
};
