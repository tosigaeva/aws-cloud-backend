import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createProductsRepository } from '../../repositories/productsRepository';
import { getProductsList } from '../../services/productService';
import type { ProductsRepository } from '../../services/productService';
import { handleError } from '../errorHandler';
import { jsonResponse } from '../response';

export const createGetProductsListHandler = (repository: ProductsRepository): APIGatewayProxyHandler => async (event) => {
  console.log('getProductsList request received', {
    path: event.path,
    queryStringParameters: event.queryStringParameters,
  });

  try {
    const products = await getProductsList(repository);

    return jsonResponse(200, products);
  } catch (error) {
    return handleError(error);
  }
};

export const handler: APIGatewayProxyHandler = (event, context, callback) => (
  createGetProductsListHandler(createProductsRepository())(event, context, callback)
);
