import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createProductsRepository } from '../../repositories/productsRepository';
import { getProductById } from '../../services/productService';
import type { ProductsRepository } from '../../services/productService';
import { handleError } from '../errorHandler';
import { jsonResponse } from '../response';

export const createGetProductsByIdHandler = (repository: ProductsRepository): APIGatewayProxyHandler => async (event) => {
  console.log('getProductsById request received', {
    path: event.path,
    pathParameters: event.pathParameters,
  });

  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return jsonResponse(400, { message: 'Product id is required' });
    }

    const product = await getProductById(repository, productId);

    if (!product) {
      return jsonResponse(404, { message: 'Product not found' });
    }

    return jsonResponse(200, product);
  } catch (error) {
    return handleError(error);
  }
};

export const handler: APIGatewayProxyHandler = (event, context, callback) => (
  createGetProductsByIdHandler(createProductsRepository())(event, context, callback)
);
