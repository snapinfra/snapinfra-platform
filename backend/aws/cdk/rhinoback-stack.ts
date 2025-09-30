import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class RhinoBackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const projectsTable = new dynamodb.Table(this, 'ProjectsTable', {
      tableName: 'rhinoback-projects',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
      pointInTimeRecovery: true
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'rhinoback-users',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true
    });

    const schemasTable = new dynamodb.Table(this, 'SchemasTable', {
      tableName: 'rhinoback-schemas',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true
    });

    const deploymentsTable = new dynamodb.Table(this, 'DeploymentsTable', {
      tableName: 'rhinoback-deployments',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true
    });

    // S3 Bucket for file storage
    const storageBucket = new s3.Bucket(this, 'StorageBucket', {
      bucketName: `rhinoback-storage-${this.account}-${this.region}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For development
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
        allowedOrigins: ['*'], // Restrict in production
        allowedHeaders: ['*'],
        maxAge: 3000
      }]
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'rhinoback-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true
      },
      autoVerify: {
        email: true
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'rhinoback-client',
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true
      },
      generateSecret: true
    });

    // SQS Queues
    const codeGenerationQueue = new sqs.Queue(this, 'CodeGenerationQueue', {
      queueName: 'rhinoback-code-generation',
      visibilityTimeout: cdk.Duration.minutes(15), // Long timeout for AI processing
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'CodeGenerationDLQ', {
          queueName: 'rhinoback-code-generation-dlq'
        }),
        maxReceiveCount: 3
      }
    });

    const deploymentQueue = new sqs.Queue(this, 'DeploymentQueue', {
      queueName: 'rhinoback-deployments',
      visibilityTimeout: cdk.Duration.minutes(30), // Long timeout for deployments
      retentionPeriod: cdk.Duration.days(14)
    });

    // SNS Topics
    const deploymentNotifications = new sns.Topic(this, 'DeploymentNotifications', {
      topicName: 'rhinoback-deployment-notifications',
      displayName: 'RhinoBack Deployment Notifications'
    });

    // IAM Role for backend application
    const backendRole = new iam.Role(this, 'BackendRole', {
      roleName: 'RhinoBackBackendRole',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'), // Can be changed for ECS
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ],
              resources: [
                projectsTable.tableArn,
                usersTable.tableArn,
                schemasTable.tableArn,
                deploymentsTable.tableArn
              ]
            })
          ]
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket'
              ],
              resources: [
                storageBucket.bucketArn,
                `${storageBucket.bucketArn}/*`
              ]
            })
          ]
        }),
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
              ],
              resources: ['*']
            })
          ]
        }),
        SQSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sqs:SendMessage',
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes'
              ],
              resources: [
                codeGenerationQueue.queueArn,
                deploymentQueue.queueArn
              ]
            })
          ]
        }),
        SNSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sns:Publish'
              ],
              resources: [deploymentNotifications.topicArn]
            })
          ]
        })
      }
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: storageBucket.bucketName,
      description: 'S3 Storage Bucket Name'
    });

    new cdk.CfnOutput(this, 'ProjectsTableName', {
      value: projectsTable.tableName,
      description: 'DynamoDB Projects Table Name'
    });

    new cdk.CfnOutput(this, 'BackendRoleArn', {
      value: backendRole.roleArn,
      description: 'Backend Application IAM Role ARN'
    });
  }
}