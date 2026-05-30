import * as assert from 'node:assert/strict';
import { after, test } from 'node:test';
import type { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { handler } from '../authorization-service/src/lambdas/basicAuthorizer';

const event = (authorizationToken?: string) => ({
  type: 'TOKEN',
  authorizationToken,
  methodArn: 'arn:aws:execute-api:eu-central-1:123456789012:api-id/dev/GET/import',
}) as APIGatewayTokenAuthorizerEvent;

const token = (credentials: string) => `Basic ${Buffer.from(credentials).toString('base64')}`;
const previousPassword = process.env.tosigaeva;

process.env.tosigaeva = 'TEST_PASSWORD';

after(() => {
  if (previousPassword === undefined) {
    delete process.env.tosigaeva;
  } else {
    process.env.tosigaeva = previousPassword;
  }
});

test('basicAuthorizer returns Allow policy for valid credentials', async () => {
  const response = await handler(event(token('tosigaeva:TEST_PASSWORD')));

  assert.equal(response.principalId, 'tosigaeva');
  assert.equal(response.policyDocument.Statement[0].Effect, 'Allow');
});

test('basicAuthorizer returns Deny policy for invalid credentials', async () => {
  const response = await handler(event(token('tosigaeva:wrong-password')));

  assert.equal(response.principalId, 'tosigaeva');
  assert.equal(response.policyDocument.Statement[0].Effect, 'Deny');
});

test('basicAuthorizer rejects missing authorization header', async () => {
  await assert.rejects(handler(event()), /Unauthorized/);
});
