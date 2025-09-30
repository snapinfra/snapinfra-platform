export function validateEnv(): void {
  const requiredVars = [
    'AWS_REGION',
    'JWT_SECRET'
  ];

  const optionalVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'GROQ_API_KEY',
    'OPENAI_API_KEY'
  ];

  const missingRequired = requiredVars.filter(varName => !process.env[varName]);

  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingRequired.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease create a .env file with the required variables.');
    console.error('Use .env.example as a template.\n');
  } else {
    console.log('✅ Environment variables validated successfully');
  }

  // Warn about missing optional variables
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    missingOptional.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('Some features may not work without these variables.\n');
  }

  // AWS credentials check
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️  AWS credentials not found in environment variables.');
    console.warn('Make sure to configure AWS credentials via:');
    console.warn('   - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
    console.warn('   - AWS CLI (aws configure)');
    console.warn('   - IAM roles (for EC2/ECS deployments)');
    console.warn('   - AWS credentials file (~/.aws/credentials)\n');
  }
}