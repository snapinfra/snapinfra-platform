# RhinoBack AWS Setup Script for Windows
# This script will help you set up AWS services for your RhinoBack backend

Write-Host "🚀 RhinoBack AWS Setup Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($CommandName)
    try {
        Get-Command $CommandName -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to install AWS CLI
function Install-AWSCLI {
    Write-Host "📦 Installing AWS CLI..." -ForegroundColor Yellow
    
    # Download AWS CLI installer
    $awsCliUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $installerPath = "$env:TEMP\AWSCLIV2.msi"
    
    try {
        Write-Host "   Downloading AWS CLI installer..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $awsCliUrl -OutFile $installerPath
        
        Write-Host "   Running installer (this may take a moment)..." -ForegroundColor Gray
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $installerPath, "/quiet" -Wait
        
        Write-Host "   Cleaning up..." -ForegroundColor Gray
        Remove-Item $installerPath -Force
        
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        Write-Host "✅ AWS CLI installed successfully!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to install AWS CLI: $_" -ForegroundColor Red
        Write-Host "   Please download and install manually from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
        return $false
    }
}

# Function to install Node.js global packages
function Install-NodePackages {
    Write-Host "📦 Installing required Node.js packages..." -ForegroundColor Yellow
    
    try {
        Write-Host "   Installing AWS CDK..." -ForegroundColor Gray
        npm install -g aws-cdk | Out-Null
        
        Write-Host "✅ Node.js packages installed successfully!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to install Node.js packages: $_" -ForegroundColor Red
        return $false
    }
}

# Check Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
} else {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
}

# Check/Install AWS CLI
if (-not (Test-Command "aws")) {
    Write-Host "⚠️  AWS CLI not found. Installing..." -ForegroundColor Yellow
    $awsInstalled = Install-AWSCLI
    
    if (-not $awsInstalled) {
        Write-Host "❌ Cannot proceed without AWS CLI. Please install manually and run this script again." -ForegroundColor Red
        exit 1
    }
    
    # Check again after installation
    if (-not (Test-Command "aws")) {
        Write-Host "⚠️  AWS CLI installation completed, but command not found in current session." -ForegroundColor Yellow
        Write-Host "   Please restart PowerShell and run this script again." -ForegroundColor Yellow
        exit 0
    }
} else {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
}

# Check/Install CDK
if (-not (Test-Command "cdk")) {
    Write-Host "⚠️  AWS CDK not found. Installing..." -ForegroundColor Yellow
    $nodePackagesInstalled = Install-NodePackages
    
    if (-not $nodePackagesInstalled) {
        Write-Host "❌ Failed to install CDK. Please run: npm install -g aws-cdk" -ForegroundColor Red
        exit 1
    }
} else {
    $cdkVersion = cdk --version
    Write-Host "✅ AWS CDK found: $cdkVersion" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 AWS CREDENTIALS SETUP" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Check if AWS is configured
$awsConfigured = $false
try {
    $identity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    if ($identity) {
        Write-Host "✅ AWS credentials are already configured!" -ForegroundColor Green
        Write-Host "   Account: $($identity.Account)" -ForegroundColor Gray
        Write-Host "   User: $($identity.Arn)" -ForegroundColor Gray
        $awsConfigured = $true
    }
} catch {
    Write-Host "⚠️  AWS credentials not configured" -ForegroundColor Yellow
}

if (-not $awsConfigured) {
    Write-Host ""
    Write-Host "Please configure your AWS credentials. You need:" -ForegroundColor Yellow
    Write-Host "1. An AWS account (create at https://aws.amazon.com if you don't have one)" -ForegroundColor White
    Write-Host "2. An IAM user with programmatic access" -ForegroundColor White
    Write-Host "3. The following permissions attached to your IAM user:" -ForegroundColor White
    Write-Host "   - AmazonDynamoDBFullAccess" -ForegroundColor Gray
    Write-Host "   - AmazonS3FullAccess" -ForegroundColor Gray
    Write-Host "   - AmazonCognitoPowerUser" -ForegroundColor Gray
    Write-Host "   - AmazonSQSFullAccess" -ForegroundColor Gray
    Write-Host "   - AmazonSNSFullAccess" -ForegroundColor Gray
    Write-Host "   - AmazonBedrockFullAccess" -ForegroundColor Gray
    Write-Host "   - CloudFormationFullAccess" -ForegroundColor Gray
    Write-Host ""
    
    $configure = Read-Host "Do you want to configure AWS credentials now? (y/n)"
    
    if ($configure -eq "y" -or $configure -eq "Y") {
        Write-Host "Running 'aws configure'..." -ForegroundColor Green
        aws configure
        
        # Test the configuration
        try {
            $identity = aws sts get-caller-identity | ConvertFrom-Json
            Write-Host "✅ AWS credentials configured successfully!" -ForegroundColor Green
            Write-Host "   Account: $($identity.Account)" -ForegroundColor Gray
            $awsConfigured = $true
        } catch {
            Write-Host "❌ AWS credential configuration failed. Please check your credentials." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  Skipping AWS credential configuration." -ForegroundColor Yellow
        Write-Host "   You can configure later with: aws configure" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📋 Quick Setup Guide:" -ForegroundColor Cyan
        Write-Host "1. Go to AWS Console > IAM > Users > Create User" -ForegroundColor White
        Write-Host "2. Enable 'Programmatic access'" -ForegroundColor White
        Write-Host "3. Attach the policies listed above" -ForegroundColor White
        Write-Host "4. Save the Access Key ID and Secret Access Key" -ForegroundColor White
        Write-Host "5. Run: aws configure" -ForegroundColor White
        exit 0
    }
}

if ($awsConfigured) {
    Write-Host ""
    Write-Host "🏗️  AWS INFRASTRUCTURE DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    
    $deploy = Read-Host "Do you want to deploy the AWS infrastructure now? (y/n)"
    
    if ($deploy -eq "y" -or $deploy -eq "Y") {
        Write-Host ""
        Write-Host "🚀 Deploying AWS infrastructure..." -ForegroundColor Green
        Write-Host "   This will create:" -ForegroundColor Gray
        Write-Host "   - DynamoDB tables for data storage" -ForegroundColor Gray
        Write-Host "   - S3 bucket for file storage" -ForegroundColor Gray
        Write-Host "   - Cognito User Pool for authentication" -ForegroundColor Gray
        Write-Host "   - SQS queues for background jobs" -ForegroundColor Gray
        Write-Host "   - SNS topics for notifications" -ForegroundColor Gray
        Write-Host "   - IAM roles and policies" -ForegroundColor Gray
        Write-Host ""
        
        try {
            # Bootstrap CDK (one-time setup)
            Write-Host "📦 Bootstrapping CDK..." -ForegroundColor Yellow
            cdk bootstrap
            
            # Deploy the stack
            Write-Host "🚀 Deploying RhinoBack infrastructure..." -ForegroundColor Yellow
            cdk deploy --app "npx tsx aws/cdk/app.ts" --require-approval never
            
            Write-Host ""
            Write-Host "✅ AWS infrastructure deployed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 IMPORTANT: Copy the output values above to your .env file" -ForegroundColor Yellow
            Write-Host "   The deployment outputs contain the resource IDs you need" -ForegroundColor Gray
            Write-Host ""
            
        } catch {
            Write-Host "❌ Infrastructure deployment failed: $_" -ForegroundColor Red
            Write-Host "   Common issues:" -ForegroundColor Yellow
            Write-Host "   - Check your AWS permissions" -ForegroundColor Gray
            Write-Host "   - Ensure your account has sufficient limits" -ForegroundColor Gray
            Write-Host "   - Try running: cdk doctor" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "🎯 NEXT STEPS" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "1. ✅ AWS CLI and CDK installed" -ForegroundColor Green
if ($awsConfigured) {
    Write-Host "2. ✅ AWS credentials configured" -ForegroundColor Green
} else {
    Write-Host "2. ⚠️  Configure AWS credentials: aws configure" -ForegroundColor Yellow
}
Write-Host "3. 🔄 Deploy infrastructure (if not done above)" -ForegroundColor Yellow
Write-Host "4. 🔄 Update .env file with resource IDs" -ForegroundColor Yellow
Write-Host "5. 🔄 Add your AI API keys to .env" -ForegroundColor Yellow
Write-Host "6. 🔄 Test the backend: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 For detailed guidance, see:" -ForegroundColor Cyan
Write-Host "   - AWS_SETUP.md (complete setup guide)" -ForegroundColor White
Write-Host "   - IMPLEMENTATION_STATUS.md (current status)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Your RhinoBack backend will be fully functional after these steps!" -ForegroundColor Green