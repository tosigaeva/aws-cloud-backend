import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedLambdaProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
    };

    const getProductsList = new NodejsFunction(this, 'getProductsList', {
      ...sharedLambdaProps,
      functionName: 'getProductsList',
      entry: path.join(__dirname, '../src/lambdas/getProductsList/index.ts'),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const getProductsById = new NodejsFunction(this, 'getProductsById', {
      ...sharedLambdaProps,
      functionName: 'getProductsById',
      entry: path.join(__dirname, '../src/lambdas/getProductsById/index.ts'),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service',
      description: 'Public API for product catalog mock data.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
      deployOptions: {
        stageName: 'dev',
      },
    });

    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    new cdk.CfnOutput(this, 'ProductsApiUrl', {
      value: api.urlForPath('/products'),
      description: 'GET products list endpoint',
    });
  }
}
