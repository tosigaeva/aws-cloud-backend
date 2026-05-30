#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { AuthorizationServiceStack } from '../authorization-service/lib/authorization-service-stack';
import { ImportServiceStack } from '../import-service/lib/import-service-stack';
import { ProductServiceStack } from '../lib/product-service-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const productServiceStack = new ProductServiceStack(app, 'ProductServiceStack', { env });
const authorizationServiceStack = new AuthorizationServiceStack(app, 'AuthorizationServiceStack', { env });

new ImportServiceStack(app, 'ImportServiceStack', {
  env,
  catalogItemsQueue: productServiceStack.catalogItemsQueue,
  basicAuthorizer: authorizationServiceStack.basicAuthorizer,
});
