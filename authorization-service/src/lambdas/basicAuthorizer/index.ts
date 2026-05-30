import type {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  StatementEffect,
} from 'aws-lambda';

type BasicCredentials = {
  username: string;
  password: string;
};

const generatePolicy = (
  principalId: string,
  effect: StatementEffect,
  resource: string,
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  },
});

const getCredentials = (authorizationToken?: string): BasicCredentials => {
  if (!authorizationToken) {
    throw new Error('Unauthorized');
  }

  const [scheme, encodedCredentials] = authorizationToken.split(' ');

  if (scheme !== 'Basic' || !encodedCredentials) {
    throw new Error('Unauthorized');
  }

  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf8');
  const separatorIndex = decodedCredentials.indexOf(':');

  if (separatorIndex < 1) {
    throw new Error('Unauthorized');
  }

  return {
    username: decodedCredentials.slice(0, separatorIndex),
    password: decodedCredentials.slice(separatorIndex + 1),
  };
};

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  console.log('basicAuthorizer request received', {
    type: event.type,
    methodArn: event.methodArn,
  });

  const { username, password } = getCredentials(event.authorizationToken);
  const isValidUser = process.env[username] === password;

  return generatePolicy(username, isValidUser ? 'Allow' : 'Deny', event.methodArn);
};
