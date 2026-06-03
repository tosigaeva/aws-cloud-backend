import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';

const corsResponseHeaders = {
  'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
  'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
  'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
};

export type ImportServiceStackProps = cdk.StackProps & {
  catalogItemsQueue: sqs.IQueue;
  basicAuthorizer: lambda.IFunction;
};

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'ImportBucket', {
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const sharedLambdaProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        CATALOG_ITEMS_QUEUE_URL: props.catalogItemsQueue.queueUrl,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
    };

    const importProductsFile = new NodejsFunction(this, 'importProductsFile', {
      ...sharedLambdaProps,
      functionName: 'importProductsFile',
      entry: path.join(__dirname, '../src/lambdas/importProductsFile/index.ts'),
    });

    const importFileParser = new NodejsFunction(this, 'importFileParser', {
      ...sharedLambdaProps,
      functionName: 'importFileParser',
      entry: path.join(__dirname, '../src/lambdas/importFileParser/index.ts'),
    });

    bucket.grantPut(importProductsFile, 'uploaded/*');
    bucket.grantReadWrite(importFileParser);
    props.catalogItemsQueue.grantSendMessages(importFileParser);
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: 'uploaded/' },
    );

    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
      restApiName: 'Import Service',
      description: 'Public API for product CSV imports.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          ...apigateway.Cors.DEFAULT_HEADERS,
          'Authorization',
        ],
      },
      deployOptions: {
        stageName: 'dev',
      },
    });

    for (const [id, responseType] of [
      ['UnauthorizedCorsResponse', apigateway.ResponseType.UNAUTHORIZED],
      ['AccessDeniedCorsResponse', apigateway.ResponseType.ACCESS_DENIED],
      ['Default4xxCorsResponse', apigateway.ResponseType.DEFAULT_4XX],
      ['Default5xxCorsResponse', apigateway.ResponseType.DEFAULT_5XX],
    ] as const) {
      api.addGatewayResponse(id, {
        type: responseType,
        responseHeaders: corsResponseHeaders,
      });
    }

    const importResource = api.root.addResource('import');
    const authorizerInvokeRole = new iam.Role(this, 'ImportBasicAuthorizerInvokeRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });
    props.basicAuthorizer.grantInvoke(authorizerInvokeRole);

    const basicAuthorizer = new apigateway.TokenAuthorizer(this, 'ImportBasicAuthorizer', {
      handler: props.basicAuthorizer,
      identitySource: apigateway.IdentitySource.header('Authorization'),
      assumeRole: authorizerInvokeRole,
      resultsCacheTtl: cdk.Duration.seconds(0),
    });

    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFile), {
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer: basicAuthorizer,
      requestParameters: {
        'method.request.querystring.name': true,
      },
    });

    new cdk.CfnOutput(this, 'ImportApiUrl', {
      value: api.urlForPath('/import'),
      description: 'GET import signed URL endpoint',
    });

    new cdk.CfnOutput(this, 'ImportBucketName', {
      value: bucket.bucketName,
      description: 'S3 bucket for uploaded product CSV files',
    });
  }
}
