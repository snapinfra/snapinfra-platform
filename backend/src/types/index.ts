// User types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
  cognitoId: string;
}

// Project types
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  schema: DatabaseSchema;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  deployments: Deployment[];
}

export enum ProjectStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  READY = 'ready',
  DEPLOYING = 'deploying',
  DEPLOYED = 'deployed',
  ERROR = 'error'
}

// Database schema types
export interface DatabaseSchema {
  id: string;
  projectId: string;
  name: string;
  tables: Table[];
  relationships: Relationship[];
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  name: string;
  fields: Field[];
  indexes: Index[];
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: any;
  constraints?: FieldConstraint[];
}

export enum FieldType {
  STRING = 'string',
  INTEGER = 'integer',
  FLOAT = 'float',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TEXT = 'text',
  JSON = 'json'
}

export interface FieldConstraint {
  type: 'min' | 'max' | 'length' | 'regex' | 'foreign_key';
  value: any;
  message?: string;
}

export interface Index {
  id: string;
  name: string;
  fields: string[];
  unique: boolean;
}

export interface Relationship {
  id: string;
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  type: RelationshipType;
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
}

export enum RelationshipType {
  ONE_TO_ONE = 'one_to_one',
  ONE_TO_MANY = 'one_to_many',
  MANY_TO_MANY = 'many_to_many'
}

// Deployment types
export interface Deployment {
  id: string;
  projectId: string;
  userId: string;
  platform: DeploymentPlatform;
  status: DeploymentStatus;
  url?: string;
  logs: DeploymentLog[];
  config: DeploymentConfig;
  createdAt: string;
  updatedAt: string;
}

export enum DeploymentPlatform {
  VERCEL = 'vercel',
  RAILWAY = 'railway',
  RENDER = 'render',
  HEROKU = 'heroku',
  AWS_ECS = 'aws_ecs'
}

export enum DeploymentStatus {
  PENDING = 'pending',
  BUILDING = 'building',
  DEPLOYING = 'deploying',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export interface DeploymentLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

export interface DeploymentConfig {
  environmentVariables: Record<string, string>;
  buildCommand?: string;
  startCommand?: string;
  nodeVersion?: string;
  region?: string;
}

// AI types
export interface AIRequest {
  prompt: string;
  systemMessage?: string;
  options?: AIGenerationOptions;
}

export interface AIGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  stream?: boolean;
  stop?: string | string[];
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined;
  finishReason?: string | undefined;
}

export interface AIStreamChunk {
  content: string;
  isComplete: boolean;
  error?: string;
}

// Code generation types
export interface CodeGenerationRequest {
  projectId: string;
  schema: DatabaseSchema;
  framework: 'express' | 'fastify' | 'nest';
  database: 'postgresql' | 'mysql' | 'mongodb';
  features: CodeFeature[];
  options?: CodeGenerationOptions;
}

export interface CodeFeature {
  type: 'auth' | 'crud' | 'validation' | 'swagger' | 'testing' | 'docker';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface CodeGenerationOptions {
  language: 'typescript' | 'javascript';
  includeTests: boolean;
  includeDocumentation: boolean;
  codeStyle?: 'standard' | 'airbnb' | 'prettier';
}

export interface GeneratedCode {
  id: string;
  projectId: string;
  files: GeneratedFile[];
  metadata: CodeMetadata;
  createdAt: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'model' | 'controller' | 'route' | 'middleware' | 'config' | 'test' | 'other';
}

export interface CodeMetadata {
  framework: string;
  database: string;
  features: string[];
  linesOfCode: number;
  fileCount: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Environment types
export interface Environment {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  BEDROCK_MODEL_ID: string;
  BEDROCK_REGION: string;
  DYNAMODB_PROJECTS_TABLE: string;
  DYNAMODB_USERS_TABLE: string;
  DYNAMODB_SCHEMAS_TABLE: string;
  DYNAMODB_DEPLOYMENTS_TABLE: string;
  S3_BUCKET_NAME: string;
  S3_BUCKET_REGION: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET?: string;
  SQS_CODE_GENERATION_QUEUE: string;
  SQS_DEPLOYMENT_QUEUE: string;
  SNS_DEPLOYMENT_NOTIFICATIONS: string;
  MAX_FILE_SIZE: number;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
}