import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

import answersWebhookHandler from './answers-webhook-handler';

const RESOURCE_NAME = 'my-formsort-answers';

// Create an S3 bucket to store received webhooks
const answersBucket = new aws.s3.Bucket(RESOURCE_NAME);

const answersTable = new aws.dynamodb.Table('answersWebhookTable', {
  attributes: [{ name: 'responder_uuid', type: 'S' }],
  hashKey: 'responder_uuid',
  billingMode: 'PAY_PER_REQUEST',
});

// Define the webhook to receive answers
const answersWebhookLambda = new aws.lambda.CallbackFunction(
  'answers-webhook-handler',
  {
    callback: answersWebhookHandler,
    environment: {
      variables: {
        ANSWERS_BUCKET_NAME: answersBucket.id,
        ANSWERS_DYNAMO_TABLE_NAME: answersTable.name,
      },
    },
  }
);

// Create an API gateway to expose the lambdas
const endpoint = new awsx.classic.apigateway.API(RESOURCE_NAME, {
  routes: [
    {
      path: '/api/answers-ingest',
      method: 'POST',
      eventHandler: answersWebhookLambda,
      contentType: 'application/json',
    },
  ],
});

// Export variables useful for configuration
export const endpointUrl = endpoint.url;
export const answersBucketName = answersBucket.id;
