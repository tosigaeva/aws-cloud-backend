import * as assert from 'node:assert/strict';
import { Readable } from 'stream';
import { test } from 'node:test';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, S3Event } from 'aws-lambda';
import { createImportFileParserHandler } from '../import-service/src/lambdas/importFileParser';
import { createImportProductsFileHandler } from '../import-service/src/lambdas/importProductsFile';
import type { S3ObjectRepository } from '../import-service/src/repositories/s3ObjectRepository';

const apiEvent = (name?: string) => ({
  path: '/import',
  queryStringParameters: name ? { name } : null,
}) as APIGatewayProxyEvent;

const s3Event = (bucket: string, key: string) => ({
  Records: [
    {
      s3: {
        bucket: { name: bucket },
        object: { key },
      },
    },
  ],
}) as S3Event;

test('importProductsFile returns signed upload URL', async () => {
  const handler = createImportProductsFileHandler({
    async getSignedUploadUrl(fileName: string) {
      return `https://signed.example.com/uploaded/${fileName}`;
    },
  });

  const response = await handler(apiEvent('products.csv'), null as never, null as never) as APIGatewayProxyResult;

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, 'https://signed.example.com/uploaded/products.csv');
});

test('importProductsFile returns 400 when file name is missing', async () => {
  const handler = createImportProductsFileHandler({
    async getSignedUploadUrl() {
      throw new Error('Should not be called');
    },
  });

  const response = await handler(apiEvent(), null as never, null as never) as APIGatewayProxyResult;

  assert.equal(response.statusCode, 400);
});

test('importFileParser reads CSV and moves parsed file', async () => {
  const calls: string[] = [];
  const repository: S3ObjectRepository = {
    async getObjectStream() {
      calls.push('getObjectStream');

      return Readable.from(['title,description,price,count\nTest product,Imported,10,3\n']);
    },
    async copyObject(_bucket, sourceKey, destinationKey) {
      calls.push(`copy:${sourceKey}:${destinationKey}`);
    },
    async deleteObject(_bucket, key) {
      calls.push(`delete:${key}`);
    },
  };
  const handler = createImportFileParserHandler(repository);

  await handler(s3Event('imports-bucket', 'uploaded/products.csv'), null as never, null as never);

  assert.deepEqual(calls, [
    'getObjectStream',
    'copy:uploaded/products.csv:parsed/products.csv',
    'delete:uploaded/products.csv',
  ]);
});
