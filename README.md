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

To configure SNS email subscriptions for imported product notifications, create `.env` from `.env.example` and set:

```env
PRODUCT_CREATED_EMAIL=you@example.com
EXPENSIVE_PRODUCT_CREATED_EMAIL=you+expensive@example.com
```

`npm run deploy` loads these values and passes them to CDK context.

## Import Service

The Import Service exposes a signed S3 upload URL endpoint and parses uploaded CSV files.

### Endpoints

- `GET /import?name=products.csv` returns a clean signed URL string for uploading `uploaded/products.csv`.

### S3 Flow

The CDK stack provisions an S3 bucket with browser PUT CORS enabled.

1. Frontend calls `GET /import?name=<fileName>`.
2. Import Service returns a signed S3 URL.
3. Frontend uploads the CSV with `PUT` to the signed URL.
4. `importFileParser` is triggered by `s3:ObjectCreated:*` events under `uploaded/`.
5. The parser sends CSV records to SQS, copies the file to `parsed/`, and deletes it from `uploaded/`.

After deployment, CDK prints the `ImportApiUrl` output for frontend integration.

## Async Catalog Import

CSV import uses async communication between Import Service and Product Service.

- `importFileParser` parses uploaded CSV files and sends each record to SQS queue `catalogItemsQueue`.
- `catalogBatchProcess` is triggered from SQS with `batchSize: 5`.
- `catalogBatchProcess` creates products in DynamoDB and publishes a notification to SNS topic `createProductTopic`.
- SNS email subscriptions are configured through CDK context values.
