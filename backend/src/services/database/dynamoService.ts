import { 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/utils/awsConfig';
import { 
  User, 
  Project, 
  DatabaseSchema, 
  Deployment, 
  ProjectStatus, 
  DeploymentStatus 
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class DynamoService {
  
  // User operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: TABLES.USERS,
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)'
    });

    await docClient.send(command);
    return user;
  }

  static async getUserById(userId: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: TABLES.USERS,
      Key: { id: userId }
    });

    const result = await docClient.send(command);
    return result.Item as User || null;
  }

  static async getUserByCognitoId(cognitoId: string): Promise<User | null> {
    const command = new ScanCommand({
      TableName: TABLES.USERS,
      FilterExpression: 'cognitoId = :cognitoId',
      ExpressionAttributeValues: {
        ':cognitoId': cognitoId
      },
      Limit: 1
    });

    const result = await docClient.send(command);
    return result.Items?.[0] as User || null;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString()
    };

    // Build dynamic update expression
    const updateFields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'createdAt' && key !== 'updatedAt'
    );

    updateFields.forEach(field => {
      updateExpression += `, ${field} = :${field}`;
      expressionAttributeValues[`:${field}`] = updates[field as keyof User];
    });

    const command = new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes as User;
  }

  // Project operations
  static async createProject(
    userId: string, 
    projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deployments'>
  ): Promise<Project> {
    const project: Project = {
      id: uuidv4(),
      userId,
      ...projectData,
      status: ProjectStatus.DRAFT,
      deployments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: TABLES.PROJECTS,
      Item: project
    });

    await docClient.send(command);
    return project;
  }

  static async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    const command = new GetCommand({
      TableName: TABLES.PROJECTS,
      Key: { 
        id: projectId,
        userId: userId 
      }
    });

    const result = await docClient.send(command);
    return result.Item as Project || null;
  }

  static async getUserProjects(userId: string, limit?: number): Promise<Project[]> {
    const command = new QueryCommand({
      TableName: TABLES.PROJECTS,
      IndexName: 'UserIdIndex', // Assumes GSI exists
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit
    });

    const result = await docClient.send(command);
    return result.Items as Project[] || [];
  }

  static async updateProject(
    projectId: string, 
    userId: string, 
    updates: Partial<Project>
  ): Promise<Project> {
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString()
    };

    const updateFields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt'
    );

    updateFields.forEach(field => {
      updateExpression += `, ${field} = :${field}`;
      expressionAttributeValues[`:${field}`] = updates[field as keyof Project];
    });

    const command = new UpdateCommand({
      TableName: TABLES.PROJECTS,
      Key: { 
        id: projectId,
        userId: userId 
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes as Project;
  }

  static async deleteProject(projectId: string, userId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.PROJECTS,
      Key: { 
        id: projectId,
        userId: userId 
      }
    });

    await docClient.send(command);
  }

  // Schema operations
  static async createSchema(
    schemaData: Omit<DatabaseSchema, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DatabaseSchema> {
    const schema: DatabaseSchema = {
      id: uuidv4(),
      ...schemaData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: TABLES.SCHEMAS,
      Item: schema
    });

    await docClient.send(command);
    return schema;
  }

  static async getSchemaById(schemaId: string, projectId: string): Promise<DatabaseSchema | null> {
    const command = new GetCommand({
      TableName: TABLES.SCHEMAS,
      Key: { 
        id: schemaId,
        projectId: projectId 
      }
    });

    const result = await docClient.send(command);
    return result.Item as DatabaseSchema || null;
  }

  static async getProjectSchemas(projectId: string): Promise<DatabaseSchema[]> {
    const command = new QueryCommand({
      TableName: TABLES.SCHEMAS,
      IndexName: 'ProjectIdIndex', // Assumes GSI exists
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId
      },
      ScanIndexForward: false
    });

    const result = await docClient.send(command);
    return result.Items as DatabaseSchema[] || [];
  }

  static async updateSchema(
    schemaId: string, 
    projectId: string, 
    updates: Partial<DatabaseSchema>
  ): Promise<DatabaseSchema> {
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString()
    };

    const updateFields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'projectId' && key !== 'createdAt' && key !== 'updatedAt'
    );

    updateFields.forEach(field => {
      updateExpression += `, ${field} = :${field}`;
      expressionAttributeValues[`:${field}`] = updates[field as keyof DatabaseSchema];
    });

    const command = new UpdateCommand({
      TableName: TABLES.SCHEMAS,
      Key: { 
        id: schemaId,
        projectId: projectId 
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes as DatabaseSchema;
  }

  // Deployment operations
  static async createDeployment(
    deploymentData: Omit<Deployment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Deployment> {
    const deployment: Deployment = {
      id: uuidv4(),
      ...deploymentData,
      status: DeploymentStatus.PENDING,
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: TABLES.DEPLOYMENTS,
      Item: deployment
    });

    await docClient.send(command);
    return deployment;
  }

  static async getDeploymentById(
    deploymentId: string, 
    projectId: string
  ): Promise<Deployment | null> {
    const command = new GetCommand({
      TableName: TABLES.DEPLOYMENTS,
      Key: { 
        id: deploymentId,
        projectId: projectId 
      }
    });

    const result = await docClient.send(command);
    return result.Item as Deployment || null;
  }

  static async getProjectDeployments(projectId: string): Promise<Deployment[]> {
    const command = new QueryCommand({
      TableName: TABLES.DEPLOYMENTS,
      IndexName: 'ProjectIdIndex',
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId
      },
      ScanIndexForward: false
    });

    const result = await docClient.send(command);
    return result.Items as Deployment[] || [];
  }

  static async updateDeployment(
    deploymentId: string, 
    projectId: string, 
    updates: Partial<Deployment>
  ): Promise<Deployment> {
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString()
    };

    const updateFields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'projectId' && key !== 'createdAt' && key !== 'updatedAt'
    );

    updateFields.forEach(field => {
      updateExpression += `, ${field} = :${field}`;
      expressionAttributeValues[`:${field}`] = updates[field as keyof Deployment];
    });

    const command = new UpdateCommand({
      TableName: TABLES.DEPLOYMENTS,
      Key: { 
        id: deploymentId,
        projectId: projectId 
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes as Deployment;
  }

  // Utility methods
  static async healthCheck(): Promise<{
    connected: boolean;
    tables: Record<string, boolean>;
    error?: string;
  }> {
    const health = {
      connected: false,
      tables: {} as Record<string, boolean>,
      error: undefined as string | undefined
    };

    try {
      // Test each table
      const tableTests = Object.entries(TABLES).map(async ([key, tableName]) => {
        try {
          await docClient.send(new ScanCommand({
            TableName: tableName,
            Limit: 1
          }));
          health.tables[key.toLowerCase()] = true;
        } catch (error) {
          health.tables[key.toLowerCase()] = false;
        }
      });

      await Promise.all(tableTests);
      
      // If any table is accessible, consider connected
      health.connected = Object.values(health.tables).some(status => status);
      
    } catch (error) {
      health.error = error instanceof Error ? error.message : 'Unknown error';
      health.connected = false;
    }

    return health;
  }

  // Batch operations
  static async batchGetProjects(projectIds: string[], userId: string): Promise<Project[]> {
    if (projectIds.length === 0) return [];

    // DynamoDB BatchGet has a limit of 100 items
    const batches = [];
    for (let i = 0; i < projectIds.length; i += 100) {
      batches.push(projectIds.slice(i, i + 100));
    }

    const allProjects: Project[] = [];
    
    for (const batch of batches) {
      const keys = batch.map(id => ({ id, userId }));
      
      // Note: This is a simplified approach. In production, use BatchGetCommand
      const promises = keys.map(key => 
        docClient.send(new GetCommand({
          TableName: TABLES.PROJECTS,
          Key: key
        }))
      );

      const results = await Promise.all(promises);
      const projects = results
        .map(result => result.Item as Project)
        .filter(Boolean);
      
      allProjects.push(...projects);
    }

    return allProjects;
  }

  // Search operations
  static async searchProjects(
    userId: string, 
    searchTerm: string, 
    limit: number = 20
  ): Promise<Project[]> {
    const command = new QueryCommand({
      TableName: TABLES.PROJECTS,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'contains(#name, :searchTerm) OR contains(description, :searchTerm)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':searchTerm': searchTerm
      },
      Limit: limit,
      ScanIndexForward: false
    });

    const result = await docClient.send(command);
    return result.Items as Project[] || [];
  }

  // Analytics queries
  static async getProjectStats(userId: string): Promise<{
    totalProjects: number;
    projectsByStatus: Record<ProjectStatus, number>;
    totalDeployments: number;
    recentActivity: Project[];
  }> {
    // Get all user projects
    const projects = await this.getUserProjects(userId);
    
    // Count by status
    const projectsByStatus = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<ProjectStatus, number>);

    // Get total deployments
    let totalDeployments = 0;
    for (const project of projects) {
      const deployments = await this.getProjectDeployments(project.id);
      totalDeployments += deployments.length;
    }

    // Recent activity (last 5 projects)
    const recentActivity = projects
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      totalProjects: projects.length,
      projectsByStatus,
      totalDeployments,
      recentActivity
    };
  }
}