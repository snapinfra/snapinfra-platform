# RhinoBack Backend

AWS-powered backend API for the RhinoBack AI-driven development platform.

## Features

- **Express.js + TypeScript** - Modern Node.js backend
- **AWS Integration** - DynamoDB, S3, Cognito, Bedrock, SQS, SNS
- **AI Services** - Groq, OpenAI, and AWS Bedrock integration
- **Authentication** - AWS Cognito user management
- **File Storage** - S3 for project files and generated code
- **Background Jobs** - SQS for async processing
- **Infrastructure as Code** - AWS CDK for resource management

## Quick Start

### Prerequisites
- Node.js 18+
- AWS Account
- AWS CLI configured

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials and API keys
   ```

3. **Deploy AWS infrastructure**
   ```bash
   # Install CDK globally if not already installed
   npm install -g aws-cdk

   # Bootstrap CDK (one-time setup)
   npx cdk bootstrap

   # Deploy infrastructure
   npx cdk deploy --app "npx tsx aws/cdk/app.ts"
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### First-time AWS Setup

If you're new to AWS, follow our detailed [AWS Setup Guide](./AWS_SETUP.md).

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Route handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── models/          # Data models and types
│   ├── utils/           # Utilities and AWS config
│   ├── types/           # TypeScript type definitions
│   └── routes/          # API route definitions
├── aws/
│   └── cdk/            # AWS CDK infrastructure code
├── .env.example        # Environment template
└── AWS_SETUP.md       # Detailed AWS setup guide
```

## API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed service status

### Authentication (Coming Soon)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Projects (Coming Soon)
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details

### AI Generation (Coming Soon)
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/stream` - Streaming generation
- `POST /api/ai/code-generation` - Generate backend code

### Deployments (Coming Soon)
- `POST /api/deployments` - Deploy project
- `GET /api/deployments/:id/status` - Deployment status
- `GET /api/deployments/:id/logs` - Deployment logs

## Environment Variables

Required variables:
```bash
AWS_REGION=us-east-1
JWT_SECRET=your-secret-key
```

Optional but recommended:
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
GROQ_API_KEY=your-groq-key
OPENAI_API_KEY=your-openai-key
```

See `.env.example` for all available options.

## AWS Services Used

- **DynamoDB** - Projects, users, schemas, deployments data
- **S3** - File storage for generated code and assets
- **Cognito** - User authentication and management
- **Bedrock** - AI model inference
- **SQS** - Background job processing
- **SNS** - Notifications
- **IAM** - Access control and permissions

## Development Scripts

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Deploy infrastructure
npm run deploy
```

## AWS Infrastructure Management

```bash
# View infrastructure changes before deploy
npx cdk diff --app "npx tsx aws/cdk/app.ts"

# Deploy infrastructure
npx cdk deploy --app "npx tsx aws/cdk/app.ts"

# Destroy infrastructure (careful!)
npx cdk destroy --app "npx tsx aws/cdk/app.ts"
```

## Security

- Environment variables for sensitive data
- AWS IAM roles and policies for access control
- Rate limiting on API endpoints
- CORS configuration for frontend integration
- JWT tokens for authentication

## Cost Management

The backend is designed to use AWS free tier services where possible:
- DynamoDB pay-per-request pricing
- S3 with lifecycle policies
- Cognito free tier for user management
- Bedrock pay-per-use pricing

Expected monthly cost: **$0-10** for moderate usage.

## Deployment

### Development
- Local development server on port 5000
- AWS services in development configuration
- Debug logging enabled

### Production
- Docker containerization ready
- ECS/Fargate deployment configuration
- Environment-specific resource naming
- Production logging and monitoring

## Contributing

1. Follow TypeScript best practices
2. Use the established project structure
3. Add tests for new features
4. Update documentation as needed
5. Follow the existing coding style

## Troubleshooting

### Common Issues

1. **AWS credentials not found**
   - Run `aws configure` to set up credentials
   - Check `.env` file has correct AWS keys

2. **CDK deployment fails**
   - Ensure AWS CLI is configured
   - Check IAM permissions
   - Run `npx cdk doctor` for diagnostics

3. **Server won't start**
   - Check all required environment variables
   - Verify Node.js version (18+)
   - Check for port conflicts

### Getting Help

- Check the [AWS Setup Guide](./AWS_SETUP.md)
- Review AWS CloudWatch logs
- Check the detailed health endpoint: `/api/health/detailed`

## License

MIT License - see LICENSE file for details.