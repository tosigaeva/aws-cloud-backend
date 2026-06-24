import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { createProductsRepository } from '../../repositories/productsRepository';
import { deleteProduct } from '../../services/productService';
import type { ProductsRepository } from '../../services/productService';
import { handleError } from '../errorHandler';
import { jsonResponse } from '../response';

export const createDeleteProductHandler = (
  repository: ProductsRepository,
) => async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const productId = event.pathParameters?.productId ?? '';

  console.log('deleteProduct request received', {
    path: event.path,
    productId,
  });

  try {
    await deleteProduct(repository, productId);

    return jsonResponse(204, null);
  } catch (error) {
    return handleError(error);
  }
};

export const handler: APIGatewayProxyHandler = async (event) => (
  createDeleteProductHandler(createProductsRepository())(event)
);
