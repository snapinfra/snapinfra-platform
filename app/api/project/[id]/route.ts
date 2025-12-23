// app/api/project/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize DynamoDB Client
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID && process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    } : undefined
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'snapinfra-data';

// Initialize S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID && process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    } : undefined
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'snapinfra-projects';

// Helper function to fetch data from S3
async function fetchFromS3(s3Key: string) {
    try {
        console.log('📦 Fetching from S3:', { bucket: S3_BUCKET, key: s3Key });

        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
        });

        const response = await s3Client.send(command);

        // Convert stream to string
        const bodyString = await response.Body?.transformToString();

        if (!bodyString) {
            throw new Error('Empty response from S3');
        }

        // Parse JSON
        const data = JSON.parse(bodyString);

        console.log('✅ Successfully fetched and parsed S3 data:', {
            size: bodyString.length,
            keys: Object.keys(data)
        });

        return {
            data,
            metadata: {
                size: response.ContentLength,
                contentType: response.ContentType,
                lastModified: response.LastModified,
            }
        };

    } catch (error) {
        console.error('❌ Failed to fetch from S3:', error);
        throw error;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;

        // Get user ID from session/headers
        const userId = request.headers.get('x-user-id') || 'user_35D1LiK0985qSJCacutmHh73oxA';

        console.log('🔍 Fetching project from DynamoDB:', { projectId, userId });

        // 1. Fetch from USER# partition to get project reference
        const userProjectCommand = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'DATA#projects'
            }
        });

        const userProjectResponse = await docClient.send(userProjectCommand);

        console.log('📋 User projects data response:', {
            items: userProjectResponse.Items?.length || 0
        });

        let projectsData = null;
        let s3Reference = null;

        if (userProjectResponse.Items && userProjectResponse.Items.length > 0) {
            const item = userProjectResponse.Items[0];

            // Check if data is stored in S3 (indicated by s3Key or s3Ref)
            if (item.s3Key || item.s3Ref) {
                // Data is in S3
                const s3Key = item.s3Key || item.s3Ref;
                console.log('📦 Projects data is in S3, fetching...', s3Key);

                const s3Result = await fetchFromS3(s3Key);
                projectsData = s3Result.data;
                s3Reference = {
                    key: s3Key,
                    ...s3Result.metadata
                };
            } else if (item.data) {
                // Data is inline in DynamoDB
                projectsData = item.data;
                console.log('📋 Projects data is inline in DynamoDB');
            }
        }

        // 2. Extract the specific project from the projects data
        let specificProject = null;

        if (projectsData) {
            // The projects data might be structured as an array or object
            if (Array.isArray(projectsData)) {
                specificProject = projectsData.find((p: any) => p.id === projectId);
            } else if (projectsData.M) {
                // DynamoDB Map format
                specificProject = projectsData.M;
            } else if (typeof projectsData === 'object') {
                // Check if it's a map with project IDs as keys
                specificProject = projectsData[projectId] || projectsData;
            }

            console.log('🎯 Found specific project:', !!specificProject);
        }

        // 3. Also check PROJECT# partition for additional data
        const projectCommand = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `PROJECT#${projectId}`
            },
            Limit: 1
        });

        const projectResponse = await docClient.send(projectCommand);

        let projectItem = null;
        if (projectResponse.Items && projectResponse.Items.length > 0) {
            projectItem = projectResponse.Items[0];
            console.log('📄 Found PROJECT# partition data');
        }

        // 4. Fetch user preferences
        let userPreferences = null;
        try {
            const prefsCommand = new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `USER#${userId}`,
                    SK: 'PREFERENCES'
                }
            });

            const prefsResponse = await docClient.send(prefsCommand);
            if (prefsResponse.Item?.data) {
                userPreferences = prefsResponse.Item.data;
            }
        } catch (err) {
            console.warn('Failed to fetch user preferences:', err);
        }

        // 5. Build complete response
        const completeProjectData = {
            // Basic info
            id: projectId,
            userId: userId,

            // Project data from S3 or DynamoDB
            ...(specificProject || {}),

            // Additional data from PROJECT# partition if exists
            ...(projectItem?.data || {}),

            // S3 reference info
            storage: s3Reference ? {
                type: 's3',
                reference: s3Reference,
                bucket: S3_BUCKET
            } : {
                type: 'dynamodb'
            },

            // User preferences
            userPreferences,

            // Metadata
            metadata: {
                fetchedAt: new Date().toISOString(),
                source: {
                    projectsDataInS3: !!s3Reference,
                    hasProjectPartition: !!projectItem
                }
            }
        };

        console.log('=== COMPLETE PROJECT DATA ===');
        console.log(JSON.stringify(completeProjectData, null, 2));
        console.log('============================');

        return NextResponse.json(completeProjectData);

    } catch (error) {
        console.error('❌ Error fetching project:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch project data',
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
            },
            { status: 500 }
        );
    }
}

// Additional endpoint to get all projects for a user
export async function GET_ALL_PROJECTS(userId: string) {
    try {
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'DATA#projects'
            }
        });

        const response = await docClient.send(command);

        if (!response.Items || response.Items.length === 0) {
            return { projects: [], storage: 'none' };
        }

        const item = response.Items[0];

        // Check if data is in S3
        if (item.s3Key || item.s3Ref) {
            const s3Key = item.s3Key || item.s3Ref;
            const s3Result = await fetchFromS3(s3Key);

            return {
                projects: Array.isArray(s3Result.data) ? s3Result.data : [s3Result.data],
                storage: 's3',
                s3Key
            };
        } else if (item.data) {
            return {
                projects: Array.isArray(item.data) ? item.data : [item.data],
                storage: 'dynamodb'
            };
        }

        return { projects: [], storage: 'unknown' };

    } catch (error) {
        console.error('Error fetching all projects:', error);
        throw error;
    }
}