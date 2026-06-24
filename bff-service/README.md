# BFF Service

Backend For Frontend proxy service for Task 10.

## Local usage

```bash
npm install
cp .env.example .env
npm run build
npm start
```

Example requests:

```bash
curl http://localhost:3000/product/products
curl -H "Authorization: Basic <token>" http://localhost:3000/cart/profile/cart
```

The first path segment is resolved through environment variables:

- `PRODUCT_URL` -> Product Service base URL
- `CART_URL` -> Cart Service base URL

If the segment is not configured, BFF returns `502 Cannot process request`.
