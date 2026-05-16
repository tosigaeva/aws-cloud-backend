import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createUploadedKey } from '../services/importProductsFile';
import type { UploadUrlProvider } from '../services/importProductsFile';

const s3Client = new S3Client({});

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
};

export const createS3UploadUrlProvider = (): UploadUrlProvider => {
  const bucketName = getRequiredEnv('BUCKET_NAME');

  return {
    async getSignedUploadUrl(fileName: string) {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: createUploadedKey(fileName),
        ContentType: 'text/csv',
      });

      return getSignedUrl(s3Client, command, { expiresIn: 60 });
    },
  };
};
