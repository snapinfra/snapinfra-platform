# Simple RhinoBack AWS Setup Script
Write-Host "RhinoBack AWS Setup Script" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found! Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version
    Write-Host "AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI not found!" -ForegroundColor Yellow
    Write-Host "Please install AWS CLI from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    
    # Try to download and install AWS CLI
    Write-Host "Attempting to download AWS CLI installer..." -ForegroundColor Yellow
    try {
        $downloadPath = "$env:TEMP\AWSCLIV2.msi"
        Invoke-WebRequest -Uri "https://awscli.amazonaws.com/AWSCLIV2.msi" -OutFile $downloadPath
        Write-Host "Downloaded AWS CLI installer to: $downloadPath" -ForegroundColor Green
        Write-Host "Please run the installer and then restart PowerShell" -ForegroundColor Yellow
        Start-Process $downloadPath
        exit 0
    } catch {
        Write-Host "Failed to download AWS CLI installer" -ForegroundColor Red
        Write-Host "Please download manually from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
        exit 1
    }
}

# Check if CDK is installed
try {
    $cdkVersion = cdk --version
    Write-Host "AWS CDK found: $cdkVersion" -ForegroundColor Green
} catch {
    Write-Host "AWS CDK not found. Installing..." -ForegroundColor Yellow
    npm install -g aws-cdk
    Write-Host "AWS CDK installed successfully" -ForegroundColor Green
}

# Check AWS credentials
Write-Host ""
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "AWS credentials configured successfully!" -ForegroundColor Green
    Write-Host "Account: $($identity.Account)" -ForegroundColor Gray
    Write-Host "User: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Host "AWS credentials not configured!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To configure AWS credentials:" -ForegroundColor Yellow
    Write-Host "1. Create an AWS account at https://aws.amazon.com" -ForegroundColor White
    Write-Host "2. Create an IAM user with programmatic access" -ForegroundColor White
    Write-Host "3. Attach these policies to the user:" -ForegroundColor White
    Write-Host "   - AmazonDynamoDBFullAccess" -ForegroundColor Gray
    Write-Host "   - AmazonS3FullAccess" -ForegroundColor Gray  
    Write-Host "   - AmazonCognitoPowerUser" -ForegroundColor Gray
    Write-Host "   - CloudFormationFullAccess" -ForegroundColor Gray
    Write-Host "4. Run: aws configure" -ForegroundColor White
    Write-Host ""
    
    $configure = Read-Host "Would you like to configure AWS credentials now? (y/n)"
    if ($configure -eq "y") {
        aws configure
        
        # Test the configuration
        try {
            $identity = aws sts get-caller-identity | ConvertFrom-Json
            Write-Host "AWS credentials configured successfully!" -ForegroundColor Green
        } catch {
            Write-Host "AWS credential configuration failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Skipping AWS configuration. Run 'aws configure' when ready." -ForegroundColor Yellow
        exit 0
    }
}

# Deploy infrastructure
Write-Host ""
Write-Host "Ready to deploy AWS infrastructure!" -ForegroundColor Green
$deploy = Read-Host "Deploy AWS infrastructure now? (y/n)"

if ($deploy -eq "y") {
    Write-Host "Deploying AWS infrastructure..." -ForegroundColor Yellow
    
    try {
        # Bootstrap CDK
        Write-Host "Bootstrapping CDK..." -ForegroundColor Gray
        cdk bootstrap
        
        # Deploy the stack
        Write-Host "Deploying RhinoBack stack..." -ForegroundColor Gray  
        cdk deploy --app "npx tsx aws/cdk/app.ts" --require-approval never
        
        Write-Host ""
        Write-Host "AWS infrastructure deployed successfully!" -ForegroundColor Green
        Write-Host "Please copy the output values to your .env file" -ForegroundColor Yellow
        
    } catch {
        Write-Host "Infrastructure deployment failed: $_" -ForegroundColor Red
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "- Check your AWS permissions" -ForegroundColor Gray
        Write-Host "- Verify account limits" -ForegroundColor Gray
        Write-Host "- Try: cdk doctor" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env file with AWS resource IDs" -ForegroundColor White
Write-Host "2. Add your AI API keys to .env" -ForegroundColor White  
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host ""