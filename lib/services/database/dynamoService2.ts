import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3StorageManager } from '../../appContext/s3-storage-manager';

// Initialize DynamoDB Client
const clientConfig: any = {
    region: process.env.AWS_REGION || 'us-east-1',
};

// Only add credentials if they're explicitly provided
if (process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID && process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    };
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'snapinfra-data';

console.log('DynamoDB Service Initialized:', {
    region: clientConfig.region,
    tableName: TABLE_NAME,
    hasCredentials: !!clientConfig.credentials,
});

// Types
export interface Project {
    id: string;
    userId: string;
    name: string;
    description?: string;
    status?: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
}

export interface ProjectUpdate {
    name?: string;
    description?: string;
    status?: string;
    [key: string]: any;
}

export class DynamoDBService {
    /**
     * Get a project by ID (with S3 support)
     * Structure: PK: PROJECT#project_id, SK: CHAT#chatId, data: {...project data or S3 reference}
     */
    static async getProjectById(
        projectId: string,
        userId: string
    ): Promise<Project | null> {
        try {
            console.log('Fetching project:', { projectId, userId });

            // Query with PK = USER#userId and SK = PROJECT#projectId
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND SK = :sk',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': `PROJECT#${projectId}`,
                },
                Limit: 1,
            });

            const response = await docClient.send(command);
            console.log('DynamoDB response:', {
                itemCount: response.Items?.length || 0,
            });

            if (!response.Items || response.Items.length === 0) {
                return null;
            }

            const item = response.Items[0];
            return await this.formatProjectFromDynamoDB(item, projectId, userId);
        } catch (error) {
            console.error('Error getting project:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown',
                projectId,
                userId,
            });
            throw error;
        }
    }

    /**
     * Get all projects for a user (with S3 support)
     * Structure: PK: USER#userId, SK: PROJECT#projectId, data: {projectId, name, ... or S3 reference}
     */
    static async getProjectsByUserId(userId: string): Promise<Project[]> {
        try {
            console.log('Fetching projects for user:', userId);

            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': 'PROJECT#',
                },
            });

            const response = await docClient.send(command);

            console.log('Projects found:', response.Items?.length || 0);

            if (!response.Items || response.Items.length === 0) {
                return [];
            }

            // For user index items, we need to fetch full project data (including from S3 if needed)
            const projectPromises = response.Items.map(async (item) => {
                const projectId = item.SK.replace('PROJECT#', '');
                // Try to get full project data
                const fullProject = await this.getProjectById(projectId, userId);
                if (fullProject) {
                    return fullProject;
                }
                // Fallback to index data if full project not found
                return await this.formatProjectFromDynamoDB(item, projectId, userId);
            });

            const projects = await Promise.all(projectPromises);
            return projects.filter((p): p is Project => p !== null);
        } catch (error) {
            console.error('Error getting projects:', error);
            throw new Error('Failed to fetch projects from database');
        }
    }

    /**
     * Create a new project
     * Creates two items:
     * 1. PK: PROJECT#projectId, SK: CHAT#timestamp, data: {...full project data}
     * 2. PK: USER#userId, SK: PROJECT#projectId, data: {...index data}
     */
    static async createProject(
        userId: string,
        projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<Project> {
        try {
            const projectId = `project_${Date.now()}`;
            const timestamp = new Date().toISOString();
            const chatId = Date.now();

            const project: Project = {
                id: projectId,
                userId,
                ...projectData,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            // Check if we should store in S3
            const s3Storage = new S3StorageManager(userId);
            let dataToStore = project;

            if (s3Storage.isEnabled() && s3Storage.shouldUseS3(project)) {
                // Save to S3 and store reference
                const s3Result = await s3Storage.saveToS3(`project:${projectId}`, project);

                if (s3Result.success) {
                    dataToStore = {
                        type: 's3_reference',
                        s3Key: s3Result.s3Key,
                        size: s3Result.size,
                        timestamp: timestamp,
                    } as any;
                    console.log(`✅ Project stored in S3, saving reference: ${projectId}`);
                } else {
                    console.warn('⚠️ Failed to save to S3, storing directly in DynamoDB');
                }
            }

            // Create main project item with data in 'data' field
            const projectCommand = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `PROJECT#${projectId}`,
                    SK: `CHAT#${chatId}`,
                    type: 'chat',
                    userId,
                    updatedAt: timestamp,
                    version: chatId,
                    data: dataToStore,
                },
            });

            // Create user index item (always store metadata in DynamoDB)
            const userIndexCommand = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `USER#${userId}`,
                    SK: `PROJECT#${projectId}`,
                    type: 'PROJECT',
                    userId,
                    updatedAt: timestamp,
                    data: {
                        projectId,
                        userId,
                        name: projectData.name,
                        description: projectData.description,
                        status: projectData.status,
                        createdAt: timestamp,
                    },
                },
            });

            // Execute both commands
            await Promise.all([
                docClient.send(projectCommand),
                docClient.send(userIndexCommand),
            ]);

            console.log('Project created:', projectId);

            return project;
        } catch (error) {
            console.error('Error creating project:', error);
            throw new Error('Failed to create project in database');
        }
    }

    /**
     * Update a project (with S3 support)
     */
    static async updateProject(
        projectId: string,
        userId: string,
        updates: ProjectUpdate
    ): Promise<Project> {
        try {
            // First, get the existing project (will fetch from S3 if needed)
            const existingProject = await this.getProjectById(projectId, userId);

            if (!existingProject) {
                throw new Error('Project not found');
            }

            const timestamp = new Date().toISOString();

            // Query to get the actual SK
            const queryCommand = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `PROJECT#${projectId}`,
                },
                Limit: 1,
            });

            const queryResponse = await docClient.send(queryCommand);

            if (!queryResponse.Items || queryResponse.Items.length === 0) {
                throw new Error('Project not found');
            }

            const item = queryResponse.Items[0];
            const sk = item.SK;

            // Merge updates with existing data
            const updatedData = {
                ...existingProject,
                ...updates,
                updatedAt: timestamp,
            };

            // Check if we should store in S3
            const s3Storage = new S3StorageManager(userId);
            let dataToStore = updatedData;

            // If data was previously in S3, delete old S3 object
            if (item.data?.type === 's3_reference' && item.data?.s3Key) {
                await s3Storage.deleteFromS3(item.data.s3Key);
                console.log(`🗑️ Deleted old S3 data for project: ${projectId}`);
            }

            // Check if updated data should go to S3
            if (s3Storage.isEnabled() && s3Storage.shouldUseS3(updatedData)) {
                const s3Result = await s3Storage.saveToS3(`project:${projectId}`, updatedData);

                if (s3Result.success) {
                    dataToStore = {
                        type: 's3_reference',
                        s3Key: s3Result.s3Key,
                        size: s3Result.size,
                        timestamp: timestamp,
                    } as any;
                    console.log(`✅ Updated project stored in S3: ${projectId}`);
                }
            }

            // Update the main project item
            const command = new UpdateCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `PROJECT#${projectId}`,
                    SK: sk,
                },
                UpdateExpression: 'SET #data = :data, #updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#data': 'data',
                    '#updatedAt': 'updatedAt',
                },
                ExpressionAttributeValues: {
                    ':data': dataToStore,
                    ':updatedAt': timestamp,
                },
                ReturnValues: 'ALL_NEW',
            });

            const response = await docClient.send(command);

            if (!response.Attributes) {
                throw new Error('Failed to update project');
            }

            // Also update the user index if name or status changed
            if (updates.name || updates.status || updates.description) {
                const indexUpdateExpressions: string[] = [];
                const indexAttrNames: Record<string, string> = {};
                const indexAttrValues: Record<string, any> = {};

                if (updates.name) {
                    indexUpdateExpressions.push('#dataName = :name');
                    indexAttrNames['#dataName'] = 'data.name';
                    indexAttrValues[':name'] = updates.name;
                }
                if (updates.status) {
                    indexUpdateExpressions.push('#dataStatus = :status');
                    indexAttrNames['#dataStatus'] = 'data.status';
                    indexAttrValues[':status'] = updates.status;
                }
                if (updates.description) {
                    indexUpdateExpressions.push('#dataDesc = :description');
                    indexAttrNames['#dataDesc'] = 'data.description';
                    indexAttrValues[':description'] = updates.description;
                }

                indexUpdateExpressions.push('#updatedAt = :updatedAt');
                indexAttrNames['#updatedAt'] = 'updatedAt';
                indexAttrValues[':updatedAt'] = timestamp;

                try {
                    await docClient.send(
                        new UpdateCommand({
                            TableName: TABLE_NAME,
                            Key: {
                                PK: `USER#${userId}`,
                                SK: `PROJECT#${projectId}`,
                            },
                            UpdateExpression: `SET ${indexUpdateExpressions.join(', ')}`,
                            ExpressionAttributeNames: indexAttrNames,
                            ExpressionAttributeValues: indexAttrValues,
                        })
                    );
                } catch (err) {
                    console.warn('Failed to update user index:', err);
                }
            }

            return updatedData;
        } catch (error) {
            console.error('Error updating project:', error);
            if (error instanceof Error && error.message === 'Project not found') {
                throw error;
            }
            throw new Error('Failed to update project in database');
        }
    }

    /**
     * Delete a project (with S3 cleanup)
     * Deletes both the main project item and the user index item
     */
    static async deleteProject(
        projectId: string,
        userId: string
    ): Promise<void> {
        try {
            const s3Storage = new S3StorageManager(userId);

            // Query to get all items with this project
            const queryCommand = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `PROJECT#${projectId}`,
                },
            });

            const queryResponse = await docClient.send(queryCommand);

            if (!queryResponse.Items || queryResponse.Items.length === 0) {
                throw new Error('Project not found');
            }

            // Check if any items have S3 references and delete them
            for (const item of queryResponse.Items) {
                if (item.data?.type === 's3_reference' && item.data?.s3Key) {
                    await s3Storage.deleteFromS3(item.data.s3Key);
                    console.log(`🗑️ Deleted S3 data: ${item.data.s3Key}`);
                }
            }

            // Delete all items with this project (all CHAT entries)
            const deletePromises = queryResponse.Items.map((item) =>
                docClient.send(
                    new DeleteCommand({
                        TableName: TABLE_NAME,
                        Key: {
                            PK: item.PK,
                            SK: item.SK,
                        },
                    })
                )
            );

            // Also delete the user index
            deletePromises.push(
                docClient.send(
                    new DeleteCommand({
                        TableName: TABLE_NAME,
                        Key: {
                            PK: `USER#${userId}`,
                            SK: `PROJECT#${projectId}`,
                        },
                    })
                )
            );

            await Promise.all(deletePromises);

            console.log('Project deleted:', projectId);
        } catch (error) {
            console.error('Error deleting project:', error);
            if (error instanceof Error && error.message === 'Project not found') {
                throw error;
            }
            throw new Error('Failed to delete project from database');
        }
    }

    /**
     * Format DynamoDB item to Project (with S3 support)
     * Extracts data from the 'data' field or fetches from S3 if it's a reference
     */
    private static async formatProjectFromDynamoDB(
        item: any,
        projectId: string,
        userId: string
    ): Promise<Project | null> {
        // Check if data is an S3 reference
        if (item.data?.type === 's3_reference' && item.data?.s3Key) {
            console.log(`📥 Loading project from S3: ${item.data.s3Key}`);
            const s3Storage = new S3StorageManager(userId);
            const s3Data = await s3Storage.loadFromS3<Project>(item.data.s3Key);

            if (s3Data) {
                return s3Data;
            }

            console.warn(`⚠️ Failed to load from S3, returning null: ${item.data.s3Key}`);
            return null;
        }

        // Extract project data from 'data' field (direct DynamoDB storage)
        const projectData = item.data || {};

        // Ensure id is set
        if (!projectData.id) {
            projectData.id = projectId;
        }

        // Ensure userId is set
        if (!projectData.userId && item.userId) {
            projectData.userId = item.userId;
        }

        // Use top-level updatedAt if available and data.updatedAt is missing
        if (!projectData.updatedAt && item.updatedAt) {
            projectData.updatedAt = item.updatedAt;
        }

        // Ensure dates are properly formatted
        const now = new Date().toISOString();
        if (!projectData.createdAt || isNaN(Date.parse(projectData.createdAt))) {
            projectData.createdAt = now;
        }
        if (!projectData.updatedAt || isNaN(Date.parse(projectData.updatedAt))) {
            projectData.updatedAt = now;
        }

        return projectData as Project;
    }

    /**
     * Get projects with pagination (with S3 support)
     */
    static async getProjectsPaginated(
        userId: string,
        limit: number = 20,
        lastEvaluatedKey?: Record<string, any>
    ): Promise<{
        projects: Project[];
        lastEvaluatedKey?: Record<string, any>;
    }> {
        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': 'PROJECT#',
                },
                Limit: limit,
                ExclusiveStartKey: lastEvaluatedKey,
            });

            const response = await docClient.send(command);

            const projectPromises =
                response.Items?.map(async (item) => {
                    const projectId = item.SK.replace('PROJECT#', '');
                    const fullProject = await this.getProjectById(projectId, userId);
                    return fullProject || await this.formatProjectFromDynamoDB(item, projectId, userId);
                }) || [];

            const projects = await Promise.all(projectPromises);

            return {
                projects: projects.filter((p): p is Project => p !== null),
                lastEvaluatedKey: response.LastEvaluatedKey,
            };
        } catch (error) {
            console.error('Error getting paginated projects:', error);
            throw new Error('Failed to fetch paginated projects');
        }
    }

    /**
     * Count total projects for a user
     */
    static async countUserProjects(userId: string): Promise<number> {
        try {
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': 'PROJECT#',
                },
                Select: 'COUNT',
            });

            const response = await docClient.send(command);

            return response.Count || 0;
        } catch (error) {
            console.error('Error counting projects:', error);
            throw new Error('Failed to count projects');
        }
    }
}

export default DynamoDBService;