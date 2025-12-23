import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  BatchWriteCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3StorageManager } from './s3-storage-manager'

interface SyncQueueItem {
  key: string;
  data: any;
  timestamp: number;
  priority: "high" | "normal" | "low";
}

interface SyncConfig {
  maxBatchSize: number;
  debounceMs: number;
  syncIntervalMs: number;
  retryAttempts: number;
}

export class DynamoDBSyncManager {
  private client: DynamoDBDocumentClient | null = null;
  private s3Storage: S3StorageManager;
  private tableName: string;
  private userId: string;
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime = 0;
  private enabled = false;

  private config: SyncConfig = {
    maxBatchSize: 25,
    debounceMs: 2000,
    syncIntervalMs: 30000,
    retryAttempts: 3,
  };

  constructor(userId: string, tableName = "snapinfra-data") {
    this.tableName = tableName;
    this.userId = userId;

    // Initialize S3 storage manager
    this.s3Storage = new S3StorageManager(userId);

    // Only initialize DynamoDB if credentials are available
    if (this.hasValidCredentials()) {
      try {
        const client = new DynamoDBClient({
          region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
          credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
          },
        });

        this.client = DynamoDBDocumentClient.from(client);
        this.enabled = true;
        this.startPeriodicSync();

        console.log('✅ DynamoDB sync enabled');
      } catch (error) {
        console.warn('⚠️ DynamoDB initialization failed:', error);
        this.enabled = false;
      }
    } else {
      console.log('ℹ️ DynamoDB credentials not configured, running in localStorage-only mode');
      this.enabled = false;
    }
  }

  private hasValidCredentials(): boolean {
    const hasRegion = !!process.env.NEXT_PUBLIC_AWS_REGION;
    const hasAccessKey = !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;
    return hasRegion && hasAccessKey && hasSecretKey;
  }

  /**
   * Queue data for sync with automatic S3 routing for large data
   */
  queueSync(
    key: string,
    data: any,
    priority: "high" | "normal" | "low" = "normal"
  ) {
    if (!this.enabled || !this.client) {
      return;
    }

    // Check if data should go to S3
    const dataSize = this.s3Storage.getDataSize(data);
    const shouldUseS3 = this.s3Storage.shouldUseS3(data);

    if (shouldUseS3) {
      console.log(`📦 Data too large for DynamoDB (${(dataSize / 1024).toFixed(2)} KB), will route to S3: ${key}`);
    }

    this.syncQueue.set(key, {
      key,
      data,
      timestamp: Date.now(),
      priority,
    });

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    if (priority === "high") {
      this.flush();
      return;
    }

    this.syncTimer = setTimeout(() => {
      this.flush();
    }, this.config.debounceMs);
  }

  /**
   * Flush all queued items to DynamoDB (with S3 routing for large items)
   */
  async flush() {
    if (!this.enabled || !this.client) {
      return;
    }

    if (this.syncQueue.size === 0 || this.isSyncing) return;

    this.isSyncing = true;
    const items = Array.from(this.syncQueue.values());
    this.syncQueue.clear();

    try {
      items.sort((a, b) => {
        const priorityMap = { high: 3, normal: 2, low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      });

      for (let i = 0; i < items.length; i += this.config.maxBatchSize) {
        const batch = items.slice(i, i + this.config.maxBatchSize);
        await this.writeBatch(batch);
      }

      this.lastSyncTime = Date.now();
      console.log(`✅ Synced ${items.length} items to DynamoDB/S3`);
    } catch (error: any) {
      console.error("❌ DynamoDB Sync Error:", {
        message: error?.message,
        code: error?.name,
        statusCode: error?.$metadata?.httpStatusCode,
        tableName: this.tableName,
        itemCount: items.length,
      });

      if (error?.message?.includes('Item size has exceeded')) {
        console.error('❌ Item too large even after S3 routing. This should not happen!');
      }

      if (error?.message?.includes('Credential')) {
        this.enabled = false;
        console.warn('⚠️ DynamoDB credentials invalid, disabling sync');
        return;
      }

      if (error?.name === 'ResourceNotFoundException') {
        console.error(`❌ Table "${this.tableName}" does not exist. Create it first!`);
        this.enabled = false;
        return;
      }

      // Re-queue failed items for retry
      items.forEach((item) => this.syncQueue.set(item.key, item));
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Write batch to DynamoDB (with automatic S3 routing)
   */
  private async writeBatch(items: SyncQueueItem[]) {
    if (!this.client) return;

    const writeRequests = [];

    for (const item of items) {
      // Check if data should go to S3
      if (this.s3Storage.isEnabled() && this.s3Storage.shouldUseS3(item.data)) {
        // Save actual data to S3
        const s3Result = await this.s3Storage.saveToS3(item.key, item.data);

        if (s3Result.success) {
          // Save reference in DynamoDB
          const reference = {
            type: 's3_reference',
            s3Key: s3Result.s3Key,
            size: s3Result.size,
            timestamp: new Date().toISOString(),
          };

          writeRequests.push({
            PutRequest: {
              Item: this.createDynamoItem(item.key, reference),
            },
          });

          console.log(`✅ Saved to S3, storing reference in DynamoDB: ${item.key}`);
        } else {
          console.error(`❌ Failed to save to S3, skipping: ${item.key}`);
        }
      } else {
        // Data is small enough for DynamoDB
        writeRequests.push({
          PutRequest: {
            Item: this.createDynamoItem(item.key, item.data),
          },
        });
      }
    }

    if (writeRequests.length > 0) {
      await this.client.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: writeRequests,
          },
        })
      );
    }
  }

  /**
   * Create DynamoDB item with proper keys
   */
  private createDynamoItem(key: string, data: any) {
    const [type, id] = key.split(":");

    let PK: string, SK: string;

    switch (type) {
      case "project":
        PK = `USER#${this.userId}`;
        SK = `PROJECT#${id}`;
        break;
      case "onboarding":
        PK = `USER#${this.userId}`;
        SK = "ONBOARDING";
        break;
      case "onboardingData":
        PK = `USER#${this.userId}`;
        SK = "ONBOARDING_DATA";
        break;
      case "onboardingStep":
        PK = `USER#${this.userId}`;
        SK = "ONBOARDING_STEP";
        break;
      case "decisions":
        PK = `PROJECT#${id}`;
        SK = "DECISIONS";
        break;
      case "chat":
        PK = `PROJECT#${id}`;
        SK = `CHAT#${Date.now()}`;
        break;
      case "preferences":
      case "user_preferences":
        PK = `USER#${this.userId}`;
        SK = "PREFERENCES";
        break;
      default:
        PK = `USER#${this.userId}`;
        SK = `DATA#${key}`;
    }

    return {
      PK,
      SK,
      type,
      data: this.sanitizeData(data),
      updatedAt: new Date().toISOString(),
      version: Date.now(),
      userId: this.userId,
    };
  }

  /**
   * Remove circular references and non-serializable data
   */
  private sanitizeData(data: any): any {
    const seen = new WeakSet();

    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }

        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return undefined;
          }
          seen.add(value);
        }

        return value;
      })
    );
  }

  /**
   * Load data from DynamoDB (with automatic S3 fetching)
   */
  async load<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) {
      return null;
    }

    const [type, id] = key.split(":");
    let PK: string, SK: string;

    switch (type) {
      case "project":
        PK = `USER#${this.userId}`;
        SK = `PROJECT#${id}`;
        break;
      case "onboarding":
        PK = `USER#${this.userId}`;
        SK = "ONBOARDING";
        break;
      case "onboardingData":
        PK = `USER#${this.userId}`;
        SK = "ONBOARDING_DATA";
        break;
      case "onboardingStep":
        PK = `USER#${this.userId}`;
        SK = "ONBOARDING_STEP";
        break;
      case "decisions":
        PK = `PROJECT#${id}`;
        SK = "DECISIONS";
        break;
      case "preferences":
      case "user_preferences":
        PK = `USER#${this.userId}`;
        SK = "PREFERENCES";
        break;
      default:
        PK = `USER#${this.userId}`;
        SK = `DATA#${key}`;
    }

    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { PK, SK },
        })
      );

      if (!result.Item?.data) {
        return null;
      }

      const data = result.Item.data;

      // Check if it's an S3 reference
      if (data.type === 's3_reference' && data.s3Key) {
        console.log(`📥 Loading from S3: ${data.s3Key}`);
        const s3Data = await this.s3Storage.loadFromS3<T>(data.s3Key);
        return s3Data;
      }

      // Direct data from DynamoDB
      return data as T;
    } catch (error) {
      console.error("Failed to load from DynamoDB:", error);
      return null;
    }
  }

  /**
   * Load all projects for user (with S3 support)
   */
  async loadAllProjects(): Promise<any[]> {
    if (!this.enabled || !this.client) {
      return [];
    }

    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": `USER#${this.userId}`,
            ":sk": "PROJECT#",
          },
        })
      );

      if (!result.Items) {
        return [];
      }

      // Load projects and fetch from S3 if needed
      const projects = await Promise.all(
        result.Items.map(async (item) => {
          const data = item.data;

          // Check if project data is in S3
          if (data.type === 's3_reference' && data.s3Key) {
            const s3Data = await this.s3Storage.loadFromS3(data.s3Key);
            return s3Data;
          }

          return data;
        })
      );

      return projects.filter(Boolean); // Remove nulls
    } catch (error) {
      console.error("Failed to load projects:", error);
      return [];
    }
  }

  /**
   * Load chat messages for a project
   */
  async loadChatMessages(projectId: string, limit = 50): Promise<any[]> {
    if (!this.enabled || !this.client) {
      return [];
    }

    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": `PROJECT#${projectId}`,
            ":sk": "CHAT#",
          },
          ScanIndexForward: false,
          Limit: limit,
        })
      );

      return result.Items?.map((item) => item.data).reverse() || [];
    } catch (error) {
      console.error("Failed to load chat messages:", error);
      return [];
    }
  }

  /**
   * Delete item (with S3 cleanup)
   */
  async delete(key: string): Promise<{ success: boolean }> {
    if (!this.enabled || !this.client) {
      return { success: false };
    }

    try {
      // First, load the item to check if it has S3 reference
      const data = await this.load(key);

      if (data && typeof data === 'object' && 'type' in data && data.type === 's3_reference' && 's3Key' in data) {
        // Delete from S3
        await this.s3Storage.deleteFromS3(data.s3Key as string);
      }

      // Delete from DynamoDB
      const [type, id] = key.split(":");
      let PK: string, SK: string;

      switch (type) {
        case "project":
          PK = `USER#${this.userId}`;
          SK = `PROJECT#${id}`;
          break;
        case "onboardingData":
          PK = `USER#${this.userId}`;
          SK = "ONBOARDING_DATA";
          break;
        case "onboardingStep":
          PK = `USER#${this.userId}`;
          SK = "ONBOARDING_STEP";
          break;
        default:
          PK = `USER#${this.userId}`;
          SK = `DATA#${key}`;
      }

      await this.client.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { PK, SK },
        })
      );

      console.log(`✅ Deleted from DynamoDB: ${key}`);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete:", error);
      return { success: false };
    }
  }

  /**
   * Delete all chat messages for a project
   */
  async deleteChatMessages(projectId: string): Promise<{ success: boolean; deletedCount: number }> {
    if (!this.enabled || !this.client) {
      return { success: false, deletedCount: 0 };
    }

    try {
      // First, query all chat messages
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": `PROJECT#${projectId}`,
            ":sk": "CHAT#",
          },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        console.log(`ℹ️ No chat messages found for project: ${projectId}`);
        return { success: true, deletedCount: 0 };
      }

      // Delete in batches
      const deleteRequests = result.Items.map(item => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        },
      }));

      // Process in batches of 25 (DynamoDB limit)
      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25);
        await this.client.send(
          new BatchWriteCommand({
            RequestItems: {
              [this.tableName]: batch,
            },
          })
        );
      }

      console.log(`✅ Deleted ${result.Items.length} chat messages for project: ${projectId}`);
      return { success: true, deletedCount: result.Items.length };
    } catch (error) {
      console.error("Failed to delete chat messages:", error);
      return { success: false, deletedCount: 0 };
    }
  }

  /**
   * Clean up all onboarding-related data
   */
  async cleanupOnboardingData(): Promise<{
    success: boolean;
    deletedItems: string[];
    errors: string[];
  }> {
    if (!this.enabled || !this.client) {
      return { success: false, deletedItems: [], errors: ['DynamoDB not enabled'] };
    }

    const deletedItems: string[] = [];
    const errors: string[] = [];

    try {
      // Delete onboarding data
      const onboardingDataResult = await this.delete('onboardingData');
      if (onboardingDataResult.success) {
        deletedItems.push('onboardingData');
      } else {
        errors.push('Failed to delete onboardingData');
      }

      // Delete onboarding step
      const onboardingStepResult = await this.delete('onboardingStep');
      if (onboardingStepResult.success) {
        deletedItems.push('onboardingStep');
      } else {
        errors.push('Failed to delete onboardingStep');
      }

      // Delete decisions
      try {
        await this.client.send(
          new DeleteCommand({
            TableName: this.tableName,
            Key: {
              PK: `USER#${this.userId}`,
              SK: "ONBOARDING",
            },
          })
        );
        deletedItems.push('onboarding');
      } catch (error) {
        // Item might not exist, which is fine
        console.log('ℹ️ Onboarding item not found (already deleted or never created)');
      }

      console.log(`✅ Onboarding cleanup complete:`, {
        deletedItems,
        errors: errors.length > 0 ? errors : 'none'
      });

      return {
        success: errors.length === 0,
        deletedItems,
        errors,
      };
    } catch (error) {
      console.error("Failed to cleanup onboarding data:", error);
      return {
        success: false,
        deletedItems,
        errors: [...errors, `Cleanup error: ${error}`],
      };
    }
  }

  private startPeriodicSync() {
    if (!this.enabled || !this.client) {
      return;
    }

    setInterval(() => {
      if (this.syncQueue.size > 0) {
        this.flush();
      }
    }, this.config.syncIntervalMs);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async syncNow() {
    return this.flush();
  }

  needsSync(): boolean {
    return Date.now() - this.lastSyncTime > this.config.syncIntervalMs;
  }

  destroy() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
  }
}