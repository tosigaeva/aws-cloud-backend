import type { S3Handler } from 'aws-lambda';
import { createS3ObjectRepository } from '../../repositories/s3ObjectRepository';
import type { S3ObjectRepository } from '../../repositories/s3ObjectRepository';
import { parseUploadedFile } from '../../services/importFileParser';

export const createImportFileParserHandler = (repository: S3ObjectRepository): S3Handler => async (event) => {
  console.log('importFileParser request received', {
    records: event.Records.map((record) => ({
      bucket: record.s3.bucket.name,
      key: record.s3.object.key,
    })),
  });

  await Promise.all(event.Records.map(async (record) => {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    await parseUploadedFile(repository, bucket, key);
  }));
};

export const handler = createImportFileParserHandler(createS3ObjectRepository());
