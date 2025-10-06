import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

console.log('🧪 Testing DynamoDB Connection...\n');
console.log('Environment:');
console.log('  AWS_REGION:', process.env.AWS_REGION);
console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set (' + process.env.AWS_ACCESS_KEY_ID.substring(0, 10) + '...)' : '✗ Not set');
console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set');
console.log('  DYNAMODB_PROJECTS_TABLE:', process.env.DYNAMODB_PROJECTS_TABLE);
console.log('');

const clientConfig: any = {
  region: process.env.AWS_REGION || 'us-east-1'
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
  console.log('✓ Using explicit credentials from environment variables\n');
} else {
  console.log('⚠️  No explicit credentials - will use default AWS credential chain\n');
}

const dynamodbClient = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

async function testDynamoDB() {
  try {
    const tableName = process.env.DYNAMODB_PROJECTS_TABLE || 'snapinfra-projects';
    const testProject = {
      id: `test-${uuidv4()}`,
      userId: 'test-user-from-script',
      name: 'Test Project from Script',
      description: 'Testing DynamoDB connection',
      status: 'draft',
      schema: {
        name: 'Test Schema',
        tables: [],
        relationships: []
      },
      deployments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`📝 Attempting to write to table: ${tableName}`);
    console.log(`📦 Test project ID: ${testProject.id}\n`);

    const command = new PutCommand({
      TableName: tableName,
      Item: testProject
    });

    await docClient.send(command);
    
    console.log('✅ SUCCESS! Project created in DynamoDB');
    console.log(`   Project ID: ${testProject.id}`);
    console.log(`   Table: ${tableName}`);
    console.log('\n🎉 The AWS SDK configuration is working correctly!');
    
  } catch (error: any) {
    console.error('❌ FAILED! Error writing to DynamoDB:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code || 'N/A');
    if (error.$metadata) {
      console.error('   HTTP Status:', error.$metadata.httpStatusCode);
      console.error('   Request ID:', error.$metadata.requestId);
    }
    console.error('\n📋 Full error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

testDynamoDB();
