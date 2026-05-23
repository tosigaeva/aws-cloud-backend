import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import csv = require('csv-parser');
import type { S3ObjectRepository } from '../repositories/s3ObjectRepository';
import type { CatalogItemsQueue } from '../repositories/sqsCatalogItemsQueue';

export const createParsedKey = (uploadedKey: string) => uploadedKey.replace(/^uploaded\//, 'parsed/');

export const parseUploadedFile = async (
  repository: S3ObjectRepository,
  catalogItemsQueue: CatalogItemsQueue,
  bucket: string,
  key: string,
) => {
  const objectStream = await repository.getObjectStream(bucket, key);
  const sendToQueue = new Transform({
    objectMode: true,
    async transform(record: Record<string, string>, _encoding, callback) {
      try {
        await catalogItemsQueue.sendCatalogItem(record);
        callback();
      } catch (error) {
        callback(error as Error);
      }
    },
  });

  await pipeline(objectStream, csv(), sendToQueue);

  const parsedKey = createParsedKey(key);
  await repository.copyObject(bucket, key, parsedKey);
  await repository.deleteObject(bucket, key);
  console.log('CSV file moved after parsing', { sourceKey: key, destinationKey: parsedKey });
};
