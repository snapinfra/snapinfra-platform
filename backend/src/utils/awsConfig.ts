import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SNSClient } from '@aws-sdk/client-sns';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// AWS Region configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Common AWS client configuration
const clientConfig = {
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
};

// DynamoDB Client
export const dynamodbClient = new DynamoDBClient(clientConfig);
export const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// S3 Client
export const s3Client = new S3Client(clientConfig);

// Cognito Client
export const cognitoClient = new CognitoIdentityProviderClient(clientConfig);

// Bedrock Client
export const bedrockClient = new BedrockRuntimeClient({
  ...clientConfig,
  region: process.env.BEDROCK_REGION || AWS_REGION
});

// SQS Client
export const sqsClient = new SQSClient(clientConfig);

// SNS Client
export const snsClient = new SNSClient(clientConfig);

// Table names
export const TABLES = {
  PROJECTS: process.env.DYNAMODB_PROJECTS_TABLE || 'rhinoback-projects',
  USERS: process.env.DYNAMODB_USERS_TABLE || 'rhinoback-users',
  SCHEMAS: process.env.DYNAMODB_SCHEMAS_TABLE || 'rhinoback-schemas',
  DEPLOYMENTS: process.env.DYNAMODB_DEPLOYMENTS_TABLE || 'rhinoback-deployments'
};

// S3 Configuration
export const S3_CONFIG = {
  BUCKET_NAME: process.env.S3_BUCKET_NAME || 'rhinoback-storage',
  BUCKET_REGION: process.env.S3_BUCKET_REGION || AWS_REGION
};

// SQS Queue URLs
export const QUEUES = {
  CODE_GENERATION: process.env.SQS_CODE_GENERATION_QUEUE || 'rhinoback-code-generation',
  DEPLOYMENT: process.env.SQS_DEPLOYMENT_QUEUE || 'rhinoback-deployments'
};

// SNS Topics
export const TOPICS = {
  DEPLOYMENT_NOTIFICATIONS: process.env.SNS_DEPLOYMENT_NOTIFICATIONS || 'rhinoback-deployment-notifications'
};

// Bedrock Configuration
export const BEDROCK_CONFIG = {
  MODEL_ID: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
  REGION: process.env.BEDROCK_REGION || AWS_REGION
};

// Cognito Configuration
export const COGNITO_CONFIG = {
  USER_POOL_ID: process.env.COGNITO_USER_POOL_ID!,
  CLIENT_ID: process.env.COGNITO_CLIENT_ID!,
  CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET
};