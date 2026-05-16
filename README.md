# aws-cloud-backend

AWS CDK backend services for the RS School AWS course.

## Product Service

The Product Service exposes product catalog data through API Gateway, AWS Lambda, and DynamoDB.

### Endpoints

- `GET /products` returns the full products array.
- `GET /products/{productId}` returns one product by `id` or `404` when it is missing.
- `POST /products` creates a product and stock record transactionally.

### DynamoDB

The CDK stack provisions two DynamoDB tables:

- `products` with partition key `id`.
- `stocks` with partition key `product_id`.

Lambda functions receive table names through `PRODUCTS_TABLE_NAME` and `STOCKS_TABLE_NAME`.

### Seed Data

After deployment, seed the tables with:

```bash
npm run seed
```

If you use different table names, pass them as environment variables:

```bash
PRODUCTS_TABLE_NAME=products STOCKS_TABLE_NAME=stocks npm run seed
```

### Swagger

OpenAPI documentation is available in `openapi.json` and can be rendered in https://editor.swagger.io/.

### Local commands

```bash
npm install
npm run build
npm test
npm run synth
```

### Deploy

```bash
npm run deploy
```

After deployment, CDK prints the `ProductsApiUrl` output for frontend integration.
