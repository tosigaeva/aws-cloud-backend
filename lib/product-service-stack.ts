import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ProductServiceStack extends cdk.Stack {
  public readonly catalogItemsQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedLambdaProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    };

    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'products',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stocksTable = new dynamodb.Table(this, 'StocksTable', {
      tableName: 'stocks',
      partitionKey: {
        name: 'product_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const tableEnvironment = {
      PRODUCTS_TABLE_NAME: productsTable.tableName,
      STOCKS_TABLE_NAME: stocksTable.tableName,
    };

    this.catalogItemsQueue = new sqs.Queue(this, 'catalogItemsQueue', {
      queueName: 'catalogItemsQueue',
    });

    const createProductTopic = new sns.Topic(this, 'createProductTopic', {
      topicName: 'createProductTopic',
    });

    const productCreatedEmail = this.node.tryGetContext('productCreatedEmail');
    const expensiveProductCreatedEmail = this.node.tryGetContext('expensiveProductCreatedEmail');

    if (productCreatedEmail) {
      createProductTopic.addSubscription(new subscriptions.EmailSubscription(productCreatedEmail));
    }

    if (expensiveProductCreatedEmail) {
      createProductTopic.addSubscription(new subscriptions.EmailSubscription(expensiveProductCreatedEmail, {
        filterPolicy: {
          priceCategory: sns.SubscriptionFilter.stringFilter({
            allowlist: ['expensive'],
          }),
        },
      }));
    }

    const getProductsList = new NodejsFunction(this, 'getProductsList', {
      ...sharedLambdaProps,
      functionName: 'getProductsList',
      entry: path.join(__dirname, '../src/lambdas/getProductsList/index.ts'),
      environment: tableEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const getProductsById = new NodejsFunction(this, 'getProductsById', {
      ...sharedLambdaProps,
      functionName: 'getProductsById',
      entry: path.join(__dirname, '../src/lambdas/getProductsById/index.ts'),
      environment: tableEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const createProduct = new NodejsFunction(this, 'createProduct', {
      ...sharedLambdaProps,
      functionName: 'createProduct',
      entry: path.join(__dirname, '../src/lambdas/createProduct/index.ts'),
      environment: tableEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const deleteProduct = new NodejsFunction(this, 'deleteProduct', {
      ...sharedLambdaProps,
      functionName: 'deleteProduct',
      entry: path.join(__dirname, '../src/lambdas/deleteProduct/index.ts'),
      environment: tableEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const catalogBatchProcess = new NodejsFunction(this, 'catalogBatchProcess', {
      ...sharedLambdaProps,
      functionName: 'catalogBatchProcess',
      entry: path.join(__dirname, '../src/lambdas/catalogBatchProcess/index.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        ...tableEnvironment,
        CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stocksTable.grantReadData(getProductsById);
    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);
    productsTable.grantWriteData(deleteProduct);
    stocksTable.grantWriteData(deleteProduct);
    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantWriteData(catalogBatchProcess);
    createProduct.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:TransactWriteItems'],
      resources: [
        productsTable.tableArn,
        stocksTable.tableArn,
      ],
    }));
    deleteProduct.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:TransactWriteItems'],
      resources: [
        productsTable.tableArn,
        stocksTable.tableArn,
      ],
    }));
    catalogBatchProcess.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:TransactWriteItems'],
      resources: [
        productsTable.tableArn,
        stocksTable.tableArn,
      ],
    }));
    this.catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);
    catalogBatchProcess.addEventSource(new eventSources.SqsEventSource(this.catalogItemsQueue, {
      batchSize: 5,
    }));
    createProductTopic.grantPublish(catalogBatchProcess);

    const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service',
      description: 'Public API for product catalog data.',
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
    products.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));
    product.addMethod('DELETE', new apigateway.LambdaIntegration(deleteProduct));

    new cdk.CfnOutput(this, 'ProductsApiUrl', {
      value: api.urlForPath('/products'),
      description: 'Products endpoint',
    });
  }
}
