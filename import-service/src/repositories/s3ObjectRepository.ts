import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';

export type S3ObjectRepository = {
  getObjectStream: (bucket: string, key: string) => Promise<Readable>;
  copyObject: (bucket: string, sourceKey: string, destinationKey: string) => Promise<void>;
  deleteObject: (bucket: string, key: string) => Promise<void>;
};

const s3Client = new S3Client({});

export const createS3ObjectRepository = (): S3ObjectRepository => ({
  async getObjectStream(bucket: string, key: string) {
    const result = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }));

    if (!result.Body) {
      throw new Error(`S3 object ${key} has no body`);
    }

    return result.Body as Readable;
  },

  async copyObject(bucket: string, sourceKey: string, destinationKey: string) {
    await s3Client.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(sourceKey).replace(/%2F/g, '/')}`,
      Key: destinationKey,
    }));
  },

  async deleteObject(bucket: string, key: string) {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
  },
});
