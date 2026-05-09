import type { APIGatewayProxyHandler } from 'aws-lambda';
import { products } from '../../data/products';
import { jsonResponse } from '../response';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('getProductsById request received', {
    pathParameters: event.pathParameters,
  });

  const productId = event.pathParameters?.productId;
  const product = products.find(({ id }) => id === productId);

  if (!product) {
    return jsonResponse(404, { message: 'Product not found' });
  }

  return jsonResponse(200, product);
};
