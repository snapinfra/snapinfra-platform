import { 
  DynamoDBClient, 
  CreateTableCommand,
  DescribeTableCommand 
} from "@aws-sdk/client-dynamodb";

/**
 * DynamoDB Table Schema for SnapInfra
 * 
 * Single-table design to minimize requests and optimize costs
 * 
 * Access Patterns:
 * 1. Get user preferences: PK=USER#{userId}, SK=PREFERENCES
 * 2. Get all projects for user: PK=USER#{userId}, SK begins_with PROJECT#
 * 3. Get specific project: PK=USER#{userId}, SK=PROJECT#{projectId}
 * 4. Get onboarding data: PK=USER#{userId}, SK=ONBOARDING
 * 5. Get chat messages: PK=PROJECT#{projectId}, SK begins_with CHAT#
 * 6. Get decisions: PK=PROJECT#{projectId}, SK=DECISIONS
 * 7. Query by update time: GSI1PK=USER#{userId}, GSI1SK=updatedAt
 */

export const TABLE_NAME = "snapinfra-data";

export const TABLE_SCHEMA = {
  TableName: TABLE_NAME,
  
  // Primary key design
  KeySchema: [
    { AttributeName: "PK", KeyType: "HASH" },  // Partition key
    { AttributeName: "SK", KeyType: "RANGE" }  // Sort key
  ],
  
  AttributeDefinitions: [
    { AttributeName: "PK", AttributeType: "S" },
    { AttributeName: "SK", AttributeType: "S" },
    { AttributeName: "GSI1PK", AttributeType: "S" },
    { AttributeName: "GSI1SK", AttributeType: "S" },
  ],
  
  // Global Secondary Index for time-based queries
  GlobalSecondaryIndexes: [
    {
      IndexName: "GSI1",
      KeySchema: [
        { AttributeName: "GSI1PK", KeyType: "HASH" },
        { AttributeName: "GSI1SK", KeyType: "RANGE" }
      ],
      Projection: {
        ProjectionType: "ALL"
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  
  // On-demand billing for cost optimization
  BillingMode: "PAY_PER_REQUEST",
  
  // Enable point-in-time recovery
  PointInTimeRecoverySpecification: {
    PointInTimeRecoveryEnabled: true
  },
  
  // Enable DynamoDB Streams for real-time sync
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: "NEW_AND_OLD_IMAGES"
  },
  
  // TTL for auto-cleanup of old data
  TimeToLiveSpecification: {
    Enabled: true,
    AttributeName: "ttl"
  },
  
  Tags: [
    { Key: "Environment", Value: "production" },
    { Key: "Application", Value: "SnapInfra" },
    { Key: "CostCenter", Value: "Engineering" }
  ]
};

/**
 * Create table if it doesn't exist
 */
export async function createTableIfNotExists() {
  const client = new DynamoDBClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1"
  });

  try {
    // Check if table exists
    await client.send(new DescribeTableCommand({ 
      TableName: TABLE_NAME 
    }));
    
    console.log(`Table ${TABLE_NAME} already exists`);
    return { exists: true };
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      // Create table
      console.log(`Creating table ${TABLE_NAME}...`);
      
      await client.send(new CreateTableCommand(TABLE_SCHEMA));
      
      console.log(`Table ${TABLE_NAME} created successfully`);
      return { exists: false, created: true };
    }
    
    throw error;
  }
}

/**
 * Example data structure for different entity types
 */
export const EXAMPLE_ITEMS = {
  // User preferences
  userPreferences: {
    PK: "USER#user123",
    SK: "PREFERENCES",
    type: "preferences",
    data: {
      sidebarCollapsed: false,
      activeTab: "schema",
      theme: "dark"
    },
    updatedAt: new Date().toISOString(),
    GSI1PK: "USER#user123",
    GSI1SK: new Date().toISOString()
  },

  // Project
  project: {
    PK: "USER#user123",
    SK: "PROJECT#proj456",
    type: "project",
    data: {
      id: "proj456",
      name: "My Project",
      description: "Project description",
      schema: [],
      endpoints: [],
      database: { type: "postgresql" }
    },
    updatedAt: new Date().toISOString(),
    GSI1PK: "USER#user123",
    GSI1SK: new Date().toISOString(),
    // Optional TTL (30 days for inactive projects)
    ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
  },

  // Onboarding data
  onboarding: {
    PK: "USER#user123",
    SK: "ONBOARDING",
    type: "onboarding",
    data: {
      step: 3,
      projectName: "Test Project",
      description: "AI-powered platform",
      schemas: [],
      decisions: {}
    },
    updatedAt: new Date().toISOString(),
    GSI1PK: "USER#user123",
    GSI1SK: new Date().toISOString(),
    // TTL for 7 days (auto-cleanup old onboarding)
    ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  },

  // Chat message
  chatMessage: {
    PK: "PROJECT#proj456",
    SK: `CHAT#${Date.now()}`,
    type: "chat",
    data: {
      id: "msg789",
      type: "user",
      content: "Hello",
      timestamp: new Date().toISOString()
    },
    updatedAt: new Date().toISOString(),
    GSI1PK: "PROJECT#proj456",
    GSI1SK: new Date().toISOString(),
    // TTL for 90 days
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
  },

  // Decisions
  decisions: {
    PK: "PROJECT#proj456",
    SK: "DECISIONS",
    type: "decisions",
    data: {
      decisions: {},
      selectedTools: {}
    },
    updatedAt: new Date().toISOString(),
    GSI1PK: "PROJECT#proj456",
    GSI1SK: new Date().toISOString()
  }
};

/**
 * CloudFormation template (alternative to SDK)
 */
export const CLOUDFORMATION_TEMPLATE = `
AWSTemplateFormatVersion: '2010-09-09'
Description: 'SnapInfra DynamoDB Table'

Resources:
  SnapInfraTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ${TABLE_NAME}
      BillingMode: PAY_PER_REQUEST
      
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: GSI1PK
          AttributeType: S
        - AttributeName: GSI1SK
          AttributeType: S
      
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: GSI1PK
              KeyType: HASH
            - AttributeName: GSI1SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      
      StreamSpecification:
        StreamEnabled: true
        StreamViewType: NEW_AND_OLD_IMAGES
      
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      
      TimeToLiveSpecification:
        Enabled: true
        AttributeName: ttl
      
      Tags:
        - Key: Environment
          Value: production
        - Key: Application
          Value: SnapInfra

Outputs:
  TableName:
    Description: DynamoDB Table Name
    Value: !Ref SnapInfraTable
    Export:
      Name: SnapInfraTableName
  
  TableArn:
    Description: DynamoDB Table ARN
    Value: !GetAtt SnapInfraTable.Arn
    Export:
      Name: SnapInfraTableArn
  
  StreamArn:
    Description: DynamoDB Stream ARN
    Value: !GetAtt SnapInfraTable.StreamArn
    Export:
      Name: SnapInfraStreamArn
`;