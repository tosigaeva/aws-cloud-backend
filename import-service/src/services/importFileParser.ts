import { pipeline } from 'stream/promises';
import csv = require('csv-parser');
import type { S3ObjectRepository } from '../repositories/s3ObjectRepository';

export const createParsedKey = (uploadedKey: string) => uploadedKey.replace(/^uploaded\//, 'parsed/');

export const parseUploadedFile = async (
  repository: S3ObjectRepository,
  bucket: string,
  key: string,
) => {
  const objectStream = await repository.getObjectStream(bucket, key);
  const parser = csv();

  parser.on('data', (record: Record<string, string>) => {
    console.log('CSV record parsed', record);
  });

  await pipeline(objectStream, parser);

  const parsedKey = createParsedKey(key);
  await repository.copyObject(bucket, key, parsedKey);
  await repository.deleteObject(bucket, key);
  console.log('CSV file moved after parsing', { sourceKey: key, destinationKey: parsedKey });
};
