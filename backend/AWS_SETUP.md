# AWS Setup Guide for RhinoBack Backend

This guide will help you set up AWS services for your RhinoBack backend.

## Prerequisites

- Node.js 18+ installed
- An AWS account
- Basic understanding of AWS services

## Step 1: Create AWS Account (if needed)

If you don't have an AWS account:
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the setup process
4. **Important**: You'll need to provide a credit card, but most services we use have generous free tiers

## Step 2: Install AWS CLI

### Option A: Using PowerShell (Recommended for Windows)
```powershell
# Download and install AWS CLI v2
# Visit: https://aws.amazon.com/cli/
# Download the Windows installer and run it
```

### Option B: Using Node.js (Alternative)
```bash
npm install -g aws-cli
```

### Verify Installation
```bash
aws --version
```

## Step 3: Create IAM User for Development

1. **Log into AWS Console**
   - Go to [console.aws.amazon.com](https://console.aws.amazon.com)
   - Sign in with your AWS account

2. **Navigate to IAM**
   - Search for "IAM" in the AWS Console
   - Click on "IAM" service

3. **Create User**
   - Click "Users" in the left sidebar
   - Click "Add users"
   - Username: `rhinoback-dev`
   - Access type: Select "Programmatic access"

4. **Attach Policies**
   For development, attach these policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonCognitoPowerUser`
   - `AmazonSQSFullAccess`
   - `AmazonSNSFullAccess`
   - `AmazonBedrockFullAccess`
   - `CloudFormationFullAccess` (for CDK)

5. **Save Credentials**
   - Copy the `Access Key ID` and `Secret Access Key`
   - **Keep these secure - don't share them!**

## Step 4: Configure AWS CLI

Run this command and enter your credentials:
```bash
aws configure
```

Enter:
- **AWS Access Key ID**: (from step 3)
- **AWS Secret Access Key**: (from step 3)
- **Default region name**: `us-east-1`
- **Default output format**: `json`

## Step 5: Update Backend Environment

1. **Copy your existing Groq API key**
   - From your frontend `.env.local` file
   - Look for `GROQ_API_KEY`

2. **Update backend/.env file**
   ```bash
   # Add your AWS credentials and Groq key
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   GROQ_API_KEY=your_groq_key_here
   ```

## Step 6: Deploy AWS Infrastructure

1. **Install CDK CLI globally**
   ```bash
   npm install -g aws-cdk
   ```

2. **Bootstrap CDK (one-time setup)**
   ```bash
   cd backend
   npx cdk bootstrap
   ```

3. **Deploy infrastructure**
   ```bash
   npx cdk deploy --app "npx tsx aws/cdk/app.ts"
   ```

   This will create:
   - 4 DynamoDB tables
   - S3 bucket for file storage
   - Cognito User Pool for authentication
   - SQS queues for background jobs
   - SNS topics for notifications
   - IAM roles with proper permissions

4. **Save the output values**
   After deployment, CDK will output important values like:
   - User Pool ID
   - User Pool Client ID  
   - S3 Bucket Name
   - Table names

## Step 7: Update Environment with AWS Resources

After CDK deployment, update your `backend/.env` file with the output values:

```bash
# Update these with actual values from CDK output
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET_NAME=rhinoback-storage-xxxxxxxxxxxx-us-east-1
DYNAMODB_PROJECTS_TABLE=rhinoback-projects
DYNAMODB_USERS_TABLE=rhinoback-users
DYNAMODB_SCHEMAS_TABLE=rhinoback-schemas
DYNAMODB_DEPLOYMENTS_TABLE=rhinoback-deployments
```

## Step 8: Test the Setup

1. **Start the backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test health endpoint**
   ```bash
   # In another terminal
   curl http://localhost:5000/api/health/detailed
   ```

   You should see all services marked as "configured"

## Step 9: Optional - Get OpenAI API Key

If you want to use OpenAI in addition to Groq:

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up/log in
3. Generate an API key
4. Add to your `.env`: `OPENAI_API_KEY=your_key_here`

## Cost Estimates

**Free Tier Usage (most services included):**
- DynamoDB: 25 GB storage, 25 read/write units
- S3: 5 GB storage, 20,000 GET requests, 2,000 PUT requests
- Cognito: 50,000 monthly active users
- SQS: 1 million requests
- SNS: 1,000 notifications

**Estimated monthly cost for moderate usage: $0-10**

## Security Notes

- Never commit AWS credentials to version control
- Use IAM roles for production deployments
- Enable MFA on your AWS account
- Regularly rotate access keys
- Monitor AWS billing dashboard

## Troubleshooting

### AWS CLI Issues
```bash
# Check if AWS CLI is properly configured
aws sts get-caller-identity
```

### CDK Issues
```bash
# If CDK deploy fails, try:
npx cdk diff --app "npx tsx aws/cdk/app.ts"
```

### Connection Issues
```bash
# Test AWS connectivity
aws dynamodb list-tables --region us-east-1
```

## Next Steps

Once setup is complete:

1. ✅ Backend server running
2. ✅ AWS infrastructure deployed
3. ✅ Environment configured
4. 🔄 Ready to implement features:
   - AI integration with Bedrock
   - Authentication with Cognito
   - Project management with DynamoDB
   - File storage with S3

## Getting Help

- AWS Documentation: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- AWS Free Tier: [aws.amazon.com/free](https://aws.amazon.com/free)
- CDK Documentation: [docs.aws.amazon.com/cdk](https://docs.aws.amazon.com/cdk)