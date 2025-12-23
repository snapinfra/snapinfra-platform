# Snapinfra

An AI-powered backend generation platform that transforms natural language descriptions into production-ready backends with comprehensive AWS infrastructure.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Frontend Environment Variables](#frontend-environment-variables)
  - [Backend Environment Variables](#backend-environment-variables)
  - [AWS Configuration](#aws-configuration)
  - [Clerk Authentication](#clerk-authentication)
  - [Groq AI Integration](#groq-ai-integration)
- [Running the Application](#running-the-application)
  - [Starting the Backend](#starting-the-backend)
  - [Starting the Frontend](#starting-the-frontend)
- [AWS Infrastructure](#aws-infrastructure)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

Snapinfra is an application that leverages AI to generate backend code, database schemas, and infrastructure-as-code configurations. The platform features:

- AI-powered backend and schema generation using Groq
- Real-time code generation with streaming responses
- Interactive schema visualization and editing
- AWS infrastructure provisioning via CDK
- Authentication and authorization with Clerk
- Persistent project storage in DynamoDB
- File storage with S3
- Async processing with SQS queues
- Real-time notifications via SNS

## Project Structure

```
Snapinfra/
├── app/                          # Next.js frontend application
│   ├── api/                      # API routes
│   │   ├── ai/                   # AI generation endpoints
│   │   ├── deploy/               # Deployment endpoints
│   │   └── ...
│   ├── dashboard/                # Dashboard page
│   ├── onboarding/               # Onboarding flow
│   ├── pitchdeck/                # Pitch deck page
│   ├── schema/                   # Schema editor
│   ├── sign-in/                  # Clerk sign-in
│   └── sign-up/                  # Clerk sign-up
│
├── backend/                      # Express.js backend server
│   ├── aws/                      # AWS CDK infrastructure
│   │   └── cdk/
│   │       ├── app.ts            # CDK app entry point
│   │       └── Snapinfra-stack.ts # Infrastructure stack
│   ├── src/
│   │   ├── middleware/           # Express middleware
│   │   │   ├── authMiddleware.ts # Clerk authentication
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── routes/               # API routes
│   │   │   ├── ai.ts             # AI generation routes
│   │   │   ├── auth.ts           # Authentication routes
│   │   │   ├── deployments.ts    # Deployment routes
│   │   │   ├── health.ts         # Health check
│   │   │   └── projects.ts       # Project management
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   └── aiService.ts  # Groq/OpenAI integration
│   │   │   └── database/
│   │   │       └── dynamoService.ts # DynamoDB operations
│   │   ├── types/                # TypeScript types
│   │   ├── utils/
│   │   │   ├── awsConfig.ts      # AWS SDK configuration
│   │   │   └── validateEnv.ts    # Environment validation
│   │   └── server.ts             # Express server entry
│   └── package.json
│
├── components/                   # React components
│   ├── ai/                       # AI chat components
│   ├── architecture/             # System architecture editor
│   ├── onboarding/               # Onboarding steps
│   ├── reactflow/                # Schema diagram components
│   └── ui/                       # Shared UI components
│
├── lib/                          # Frontend utilities
│   ├── ai/                       # AI integration modules
│   │   ├── groq-client.ts        # Groq client setup
│   │   ├── backend-generator.ts  # Backend code generation
│   │   ├── iac-generator.ts      # IaC generation
│   │   └── ...
│   ├── api-client.ts             # Backend API client
│   ├── app-context.tsx           # React context provider
│   └── utils/                    # Utility functions
│
└── public/                       # Static assets
```

## Technology Stack

### Frontend
- Next.js 15.2.3 with App Router
- React 18 with TypeScript
- Tailwind CSS for styling
- Radix UI components
- Clerk for authentication
- Groq SDK for AI integration
- React Flow for schema visualization
- Vercel Analytics

### Backend
- Node.js 18+
- Express.js with TypeScript
- Groq SDK for AI processing
- AWS SDK v3
  - DynamoDB for data persistence
  - S3 for file storage
  - SQS for async processing
  - SNS for notifications
- Clerk SDK for authentication
- Joi for validation
- Morgan for logging

### Infrastructure
- AWS CDK for infrastructure-as-code
- DynamoDB tables with Global Secondary Indexes
- S3 bucket with CORS configuration
- SQS queues with dead letter queues
- SNS topics for notifications
- IAM roles and policies

## Prerequisites

- Node.js 18 or higher
- npm, pnpm, or yarn
- AWS account with CLI configured
- Clerk account for authentication
- Groq API key for AI features

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Snapinfra
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

## Configuration

### Frontend Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key

# AI Model Configuration
AI_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
AI_TEMPERATURE=1
AI_MAX_TOKENS=8192
AI_TOP_P=1
AI_REASONING_EFFORT=medium
```

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# DynamoDB Tables
DYNAMODB_PROJECTS_TABLE=Snapinfra-projects
DYNAMODB_USERS_TABLE=Snapinfra-users
DYNAMODB_SCHEMAS_TABLE=Snapinfra-schemas
DYNAMODB_DEPLOYMENTS_TABLE=Snapinfra-deployments

# S3 Configuration
S3_BUCKET_NAME=Snapinfra-storage
S3_BUCKET_REGION=us-east-1

# AI Services Configuration
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# SQS Queues
SQS_CODE_GENERATION_QUEUE=Snapinfra-code-generation
SQS_DEPLOYMENT_QUEUE=Snapinfra-deployments

# SNS Topics
SNS_DEPLOYMENT_NOTIFICATIONS=Snapinfra-deployment-notifications

# Application Settings
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### AWS Configuration

The application uses AWS CDK to provision infrastructure. Before deploying:

1. Configure AWS CLI:
```bash
aws configure
```

2. Bootstrap CDK (first time only):
```bash
cd backend
npx cdk bootstrap
```

3. Deploy AWS infrastructure:
```bash
npm run deploy
```

This creates:
- 4 DynamoDB tables with GSIs
- S3 bucket for file storage
- SQS queues for async processing
- SNS topic for notifications
- IAM roles with appropriate permissions

### Clerk Authentication

Clerk provides authentication and user management:

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Copy the publishable and secret keys
4. Add keys to your environment files
5. Configure sign-in/sign-up paths in Clerk dashboard:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/onboarding`
   - After sign-up URL: `/onboarding`

The application uses Clerk middleware to protect routes:
- `/dashboard/*`
- `/onboarding/*`
- `/schema/*`
- `/pitchdeck/*`

### Groq AI Integration

Groq powers the AI generation features:

1. Sign up at https://console.groq.com
2. Create an API key
3. Add the key to environment files

The application uses Groq for:
- Natural language to backend code generation
- Database schema generation
- Infrastructure-as-code generation
- Code analysis and recommendations
- Streaming AI responses

Supported models:
- `meta-llama/llama-4-scout-17b-16e-instruct` (default)
- `mixtral-8x7b-32768`
- Custom model configuration

## Running the Application

### Starting the Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Start the development server:
```bash
npm run dev
```

The backend runs on `http://localhost:5000`

Available scripts:
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run lint` - Lint TypeScript files
- `npm run deploy` - Deploy AWS infrastructure

### Starting the Frontend

1. From the root directory:
```bash
npm run dev
```

The frontend runs on `http://localhost:3000`

Available scripts:
- `npm run dev` - Start Next.js development server
- `npm run build` - Create production build
- `npm start` - Run production server
- `npm run lint` - Lint Next.js application
- `npm run test:ai` - Test AI integration

## AWS Infrastructure

The CDK stack provisions the following resources:

### DynamoDB Tables

1. **Snapinfra-projects**
   - Partition Key: `id` (String)
   - Sort Key: `userId` (String)
   - GSI: `UserIdIndex` - Query projects by user

2. **Snapinfra-users**
   - Partition Key: `id` (String)
   - Stores user profiles and preferences

3. **Snapinfra-schemas**
   - Partition Key: `id` (String)
   - Sort Key: `projectId` (String)
   - GSI: `ProjectIdIndex` - Query schemas by project

4. **Snapinfra-deployments**
   - Partition Key: `id` (String)
   - Sort Key: `projectId` (String)
   - GSI: `ProjectIdIndex` - Query deployments by project

All tables use:
- Pay-per-request billing mode
- Point-in-time recovery
- Encryption at rest

### S3 Bucket

- Bucket name: `Snapinfra-storage-{account}-{region}`
- Versioning enabled
- CORS configured for web access
- Lifecycle policies for cost optimization

### SQS Queues

1. **Snapinfra-code-generation**
   - Visibility timeout: 15 minutes
   - Dead letter queue for failed jobs
   - Message retention: 14 days

2. **Snapinfra-deployments**
   - Visibility timeout: 30 minutes
   - Message retention: 14 days

### SNS Topics

- **Snapinfra-deployment-notifications**
  - Publishes deployment status updates
  - Can be subscribed to via email, SMS, Lambda, etc.

### IAM Roles

Backend application role with permissions for:
- DynamoDB read/write operations
- S3 object operations
- SQS send/receive messages
- SNS publish notifications

## Deployment

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically

The `vercel.json` configuration provides:
- Extended timeout for AI API routes (60 seconds)
- Optimized build settings

### Backend Deployment

Options for backend deployment:

1. **AWS Elastic Beanstalk**
```bash
cd backend
npm run build
eb init
eb create
```

2. **AWS ECS/Fargate**
- Build Docker image
- Push to ECR
- Deploy to ECS cluster

3. **Railway/Render**
- Connect GitHub repository
- Configure environment variables
- Deploy with automatic builds

## API Documentation

### AI Endpoints

**POST** `/api/ai/generate`
- Generate backend code from description
- Body: `{ prompt: string, options?: AIOptions }`
- Returns: Generated code and metadata

**POST** `/api/ai/stream`
- Stream AI responses in real-time
- Body: `{ prompt: string, systemMessage?: string }`
- Returns: Server-sent events stream

### Project Endpoints

**GET** `/api/projects`
- List all projects for authenticated user

**POST** `/api/projects`
- Create new project
- Body: `{ name: string, description: string }`

**GET** `/api/projects/:id`
- Get project details

**PUT** `/api/projects/:id`
- Update project

**DELETE** `/api/projects/:id`
- Delete project

### Deployment Endpoints

**POST** `/api/deploy`
- Deploy project to cloud platform
- Body: `{ projectId: string, platform: string, config: object }`

**GET** `/api/deployments/:id`
- Get deployment status and logs

### Health Check

**GET** `/api/health`
- Returns server health status and service availability

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on GitHub or contact the development team.
