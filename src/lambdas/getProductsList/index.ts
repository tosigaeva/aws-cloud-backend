import type { APIGatewayProxyHandler } from 'aws-lambda';
import { products } from '../../data/products';
import { jsonResponse } from '../response';

export const handler: APIGatewayProxyHandler = async () => {
  console.log('getProductsList request received');

  return jsonResponse(200, products);
};
