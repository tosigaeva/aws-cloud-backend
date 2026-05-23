import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createS3UploadUrlProvider } from '../../repositories/s3UploadUrlProvider';
import { validateFileName } from '../../services/importProductsFile';
import type { UploadUrlProvider } from '../../services/importProductsFile';
import { jsonResponse, textResponse } from '../response';

export const createImportProductsFileHandler = (
  uploadUrlProvider: UploadUrlProvider,
): APIGatewayProxyHandler => async (event) => {
  console.log('importProductsFile request received', {
    path: event.path,
    queryStringParameters: event.queryStringParameters,
  });

  try {
    const fileName = validateFileName(event.queryStringParameters?.name);
    const signedUrl = await uploadUrlProvider.getSignedUploadUrl(fileName);

    return textResponse(200, signedUrl);
  } catch (error) {
    console.error('importProductsFile failed', error);

    if (error instanceof Error && error.message.includes('File name')) {
      return jsonResponse(400, { message: error.message });
    }

    return jsonResponse(500, { message: 'Internal server error' });
  }
};

export const handler: APIGatewayProxyHandler = (event, context, callback) => (
  createImportProductsFileHandler(createS3UploadUrlProvider())(event, context, callback)
);
