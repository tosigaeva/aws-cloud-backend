# aws-cloud-backend

AWS CDK backend services for the RS School AWS course.

## Product Service

The Product Service exposes mock product catalog data through API Gateway and AWS Lambda.

### Endpoints

- `GET /products` returns the full products array.
- `GET /products/{productId}` returns one product by `id` or `404` when it is missing.

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
