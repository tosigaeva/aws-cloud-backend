import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const defaultGithubLogin = 'tosigaeva';

const getAuthorizerEnvironment = (): Record<string, string> => {
  const login = process.env.AUTH_LOGIN ?? process.env.GITHUB_ACCOUNT_LOGIN ?? defaultGithubLogin;
  const password = process.env.AUTH_PASSWORD ?? (login ? process.env[login] : undefined);

  return login && password ? { [login]: password } : {};
};

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizer: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.basicAuthorizer = new NodejsFunction(this, 'basicAuthorizer', {
      functionName: 'basicAuthorizer',
      entry: path.join(__dirname, '../src/lambdas/basicAuthorizer/index.ts'),
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
      environment: getAuthorizerEnvironment(),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    new cdk.CfnOutput(this, 'BasicAuthorizerFunctionName', {
      value: this.basicAuthorizer.functionName,
      description: 'Lambda authorizer for Basic Authorization tokens',
    });
  }
}
