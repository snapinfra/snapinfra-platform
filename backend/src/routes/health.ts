import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
}));

// Detailed health check with AWS services
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'missing'
      },
      database: {
        dynamodb: process.env.DYNAMODB_PROJECTS_TABLE ? 'configured' : 'missing'
      },
      storage: {
        s3: process.env.S3_BUCKET_NAME ? 'configured' : 'missing'
      },
      ai: {
        groq: process.env.GROQ_API_KEY ? 'configured' : 'missing',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
        bedrock: process.env.BEDROCK_MODEL_ID ? 'configured' : 'missing'
      }
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };

  res.json(healthCheck);
}));

export default router;