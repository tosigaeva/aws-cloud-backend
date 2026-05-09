import { jsonResponse } from './response';
import { ValidationError } from '../services/productService';

export const handleError = (error: unknown) => {
  console.error('Request failed', error);

  if (error instanceof ValidationError) {
    return jsonResponse(400, { message: error.message });
  }

  return jsonResponse(500, { message: 'Internal server error' });
};
