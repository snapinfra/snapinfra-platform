import { 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../aws-config';
import { 
  User, 
  Project, 
  DatabaseSchema, 
  Deployment, 
  ProjectStatus, 
  DeploymentStatus 
} from '@/lib/appContext/app-context';
import { v4 as uuidv4 } from 'uuid';

export class DynamoService {
  
  // User operations
  static async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    const user: User = {
      id: userData.id || uuidv4(),
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

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString()
    };
    const expressionAttributeNames: Record<string, string> = {};

    // Build dynamic update expression
    const updateFields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'createdAt' && key !== 'updatedAt'
    );

    // Common DynamoDB reserved keywords that need aliasing
    const reservedKeywords = [
      'name', 'status', 'data', 'timestamp', 'value', 'type', 'schema',
      'description', 'size', 'date', 'time', 'year', 'month', 'day',
      'percent', 'order', 'count', 'index', 'table', 'format'
    ];

    updateFields.forEach(field => {
      if (reservedKeywords.includes(field.toLowerCase())) {
        const alias = `#${field}`;
        updateExpression += `, ${alias} = :${field}`;
        expressionAttributeNames[alias] = field;
      } else {
        updateExpression += `, ${field} = :${field}`;
      }
      expressionAttributeValues[`:${field}`] = updates[field as keyof User];
    });

    const command = new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
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
    console.log('🔵 Creating project for userId:', userId);
    console.log('📦 Project data:', JSON.stringify(projectData, null, 2).substring(0, 500));
    console.log('📋 Table name:', TABLES.PROJECTS);
    
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

    try {
      await docClient.send(command);
      console.log('✅ Project created successfully:', project.id);
      return project;
    } catch (error: any) {
      console.error('❌ DynamoDB PutCommand failed:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      console.error('Full error:', JSON.stringify(error, null, 2));
      throw error;
    }
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
    const expressionAttributeNames: Record<string, string> = {};

    const updateFields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt'
    );

    // Common DynamoDB reserved keywords that need aliasing
    const reservedKeywords = [
      'name', 'status', 'data', 'timestamp', 'value', 'type', 'schema',
      'description', 'size', 'date', 'time', 'year', 'month', 'day',
      'percent', 'order', 'count', 'index', 'table', 'format'
    ];

    updateFields.forEach(field => {
      if (reservedKeywords.includes(field.toLowerCase())) {
        // Use attribute name alias for reserved keywords
        const alias = `#${field}`;
        updateExpression += `, ${alias} = :${field}`;
        expressionAttributeNames[alias] = field;
      } else {
        updateExpression += `, ${field} = :${field}`;
      }
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
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
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
    const expressionAttributeNames: Record<string, string> = {};

    const updateFields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'projectId' && key !== 'createdAt' && key !== 'updatedAt'
    );

    // Common DynamoDB reserved keywords that need aliasing
    const reservedKeywords = [
      'name', 'status', 'data', 'timestamp', 'value', 'type', 'schema',
      'description', 'size', 'date', 'time', 'year', 'month', 'day',
      'percent', 'order', 'count', 'index', 'table', 'format'
    ];

    updateFields.forEach(field => {
      if (reservedKeywords.includes(field.toLowerCase())) {
        const alias = `#${field}`;
        updateExpression += `, ${alias} = :${field}`;
        expressionAttributeNames[alias] = field;
      } else {
        updateExpression += `, ${field} = :${field}`;
      }
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
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
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

  // Architecture operations
  static async createArchitecture(architectureData: any): Promise<any> {
    const architecture = {
      id: uuidv4(),
      ...architectureData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.ARCHITECTURES,
      Item: architecture
    }));

    return architecture;
  }

  static async getArchitectureById(id: string, projectId: string): Promise<any> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.ARCHITECTURES,
      Key: { id, projectId }
    }));
    return result.Item || null;
  }

  static async getProjectArchitectures(projectId: string): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.ARCHITECTURES,
      IndexName: 'ProjectIdIndex',
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: { ':projectId': projectId },
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  static async updateArchitecture(id: string, projectId: string, updates: any): Promise<any> {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.ARCHITECTURES,
      Key: { id, projectId },
      UpdateExpression: 'SET #data = :data, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#data': 'data' },
      ExpressionAttributeValues: {
        ':data': updates.data,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    return result.Attributes;
  }

  static async deleteArchitecture(id: string, projectId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.ARCHITECTURES,
      Key: { id, projectId }
    }));
  }

  // Analytics operations
  static async trackAnalyticsEvent(eventData: any): Promise<any> {
    const event = {
      id: uuidv4(),
      ...eventData,
      timestamp: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.ANALYTICS,
      Item: event
    }));

    return event;
  }

  static async getProjectAnalytics(projectId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.ANALYTICS,
      IndexName: 'ProjectIdIndex',
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: { ':projectId': projectId },
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  static async getUserAnalytics(userId: string, limit: number = 100): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.ANALYTICS,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      Limit: limit,
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  // Activity operations
  static async logActivity(activityData: any): Promise<any> {
    const activity = {
      id: uuidv4(),
      ...activityData,
      timestamp: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.ACTIVITY,
      Item: activity
    }));

    return activity;
  }

  static async getUserActivities(userId: string, limit: number = 50): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.ACTIVITY,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      Limit: limit,
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  static async getProjectActivities(projectId: string, limit: number = 50): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.ACTIVITY,
      IndexName: 'ProjectIdIndex',
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: { ':projectId': projectId },
      Limit: limit,
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  static async deleteActivity(id: string, userId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.ACTIVITY,
      Key: { id, userId }
    }));
  }

  // Documentation operations
  static async createDocumentation(docData: any): Promise<any> {
    const documentation = {
      id: uuidv4(),
      ...docData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.DOCUMENTATION,
      Item: documentation
    }));

    return documentation;
  }

  static async getDocumentationById(id: string, projectId: string): Promise<any> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.DOCUMENTATION,
      Key: { id, projectId }
    }));
    return result.Item || null;
  }

  static async getProjectDocumentation(projectId: string): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.DOCUMENTATION,
      IndexName: 'ProjectIdIndex',
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: { ':projectId': projectId },
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  static async updateDocumentation(id: string, projectId: string, updates: any): Promise<any> {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.DOCUMENTATION,
      Key: { id, projectId },
      UpdateExpression: 'SET content = :content, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':content': updates.content,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    return result.Attributes;
  }

  static async deleteDocumentation(id: string, projectId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.DOCUMENTATION,
      Key: { id, projectId }
    }));
  }

  // Code Generation operations
  static async createCodeGeneration(codeGenData: any): Promise<any> {
    const codeGeneration = {
      id: uuidv4(),
      ...codeGenData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.CODE_GENERATIONS,
      Item: codeGeneration
    }));

    return codeGeneration;
  }

  static async getCodeGenerationById(id: string, projectId: string): Promise<any> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.CODE_GENERATIONS,
      Key: { id, projectId }
    }));
    return result.Item || null;
  }

  static async getProjectCodeGenerations(projectId: string): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.CODE_GENERATIONS,
      IndexName: 'ProjectIdIndex',
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: { ':projectId': projectId },
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  static async updateCodeGeneration(id: string, projectId: string, updates: any): Promise<any> {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.CODE_GENERATIONS,
      Key: { id, projectId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': updates.status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    return result.Attributes;
  }

  // Team operations
  static async createTeam(teamData: any): Promise<any> {
    const team = {
      id: uuidv4(),
      ...teamData,
      members: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.TEAMS,
      Item: team
    }));

    return team;
  }

  static async getTeamById(id: string): Promise<any> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.TEAMS,
      Key: { id }
    }));
    return result.Item || null;
  }

  static async getUserTeams(userId: string): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.TEAMS,
      IndexName: 'OwnerIdIndex',
      KeyConditionExpression: 'ownerId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  static async updateTeam(id: string, updates: any): Promise<any> {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.TEAMS,
      Key: { id },
      UpdateExpression: 'SET #name = :name, members = :members, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':members': updates.members,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    return result.Attributes;
  }

  static async deleteTeam(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.TEAMS,
      Key: { id }
    }));
  }

  // Settings operations
  static async getUserSettings(userId: string): Promise<any> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.SETTINGS,
      Key: { userId }
    }));
    return result.Item || null;
  }

  static async updateUserSettings(userId: string, settings: any): Promise<any> {
    const result = await docClient.send(new PutCommand({
      TableName: TABLES.SETTINGS,
      Item: {
        userId,
        ...settings,
        updatedAt: new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    return result.Attributes;
  }

  // Integration operations
  static async createIntegration(integrationData: any): Promise<any> {
    const integration = {
      id: uuidv4(),
      ...integrationData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.INTEGRATIONS,
      Item: integration
    }));

    return integration;
  }

  static async getIntegrationById(id: string, userId: string): Promise<any> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.INTEGRATIONS,
      Key: { id, userId }
    }));
    return result.Item || null;
  }

  static async getUserIntegrations(userId: string): Promise<any[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.INTEGRATIONS,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false
    }));
    return result.Items || [];
  }

  static async updateIntegration(id: string, userId: string, updates: any): Promise<any> {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.INTEGRATIONS,
      Key: { id, userId },
      UpdateExpression: 'SET #status = :status, config = :config, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': updates.status,
        ':config': updates.config,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    return result.Attributes;
  }

  static async deleteIntegration(id: string, userId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.INTEGRATIONS,
      Key: { id, userId }
    }));
  }
}
