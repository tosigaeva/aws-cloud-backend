import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { createProductsRepository } from '../../repositories/productsRepository';
import { createProduct } from '../../services/productService';
import type { ProductsRepository } from '../../services/productService';
import { handleError } from '../errorHandler';
import { jsonResponse } from '../response';

export const createCreateProductHandler = (
  repository: ProductsRepository,
) => async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('createProduct request received', {
    path: event.path,
    body: event.body,
  });

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const product = await createProduct(repository, body);

    return jsonResponse(201, product);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse(400, { message: 'Request body must be valid JSON' });
    }

    return handleError(error);
  }
};

export const handler: APIGatewayProxyHandler = async (event) => (
  createCreateProductHandler(createProductsRepository())(event)
);
