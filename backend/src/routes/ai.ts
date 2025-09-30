import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { AIService } from '@/services/ai/aiService';
import { AIRequest } from '@/types';
import Joi from 'joi';

const router = Router();

// Validation schemas
const generateSchema = Joi.object({
  prompt: Joi.string().required().min(1).max(10000),
  systemMessage: Joi.string().optional().max(5000),
  options: Joi.object({
    model: Joi.string().optional(),
    temperature: Joi.number().optional().min(0).max(2),
    maxTokens: Joi.number().optional().min(1).max(8192),
    topP: Joi.number().optional().min(0).max(1),
    reasoningEffort: Joi.string().optional().valid('low', 'medium', 'high')
  }).optional()
});

const codeGenerationSchema = Joi.object({
  description: Joi.string().required().min(10).max(2000),
  framework: Joi.string().required().valid('express', 'fastify', 'nest', 'koa'),
  language: Joi.string().optional().valid('typescript', 'javascript').default('typescript')
});

const schemaGenerationSchema = Joi.object({
  description: Joi.string().required().min(10).max(2000)
});

const explainCodeSchema = Joi.object({
  code: Joi.string().required().min(1).max(50000)
});

// Standard AI generation
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = generateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message),
      timestamp: new Date().toISOString()
    });
  }

  const aiRequest: AIRequest = {
    prompt: value.prompt,
    systemMessage: value.systemMessage,
    options: value.options
  };

  try {
    const response = await AIService.generate(aiRequest);
    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI generation failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Streaming AI generation
router.post('/stream', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = generateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }

  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  const aiRequest: AIRequest = {
    prompt: value.prompt,
    systemMessage: value.systemMessage,
    options: { ...value.options, stream: true }
  };

  try {
    for await (const chunk of AIService.generateStream(aiRequest)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      
      if (chunk.isComplete || chunk.error) {
        break;
      }
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({
      content: '',
      isComplete: true,
      error: error instanceof Error ? error.message : 'Stream generation failed'
    })}\n\n`);
  } finally {
    res.end();
  }
}));

// Code generation
router.post('/code-generation', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = codeGenerationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const response = await AIService.generateCode(
      value.description,
      value.framework,
      value.language
    );
    
    res.json({
      success: true,
      data: {
        ...response,
        metadata: {
          framework: value.framework,
          language: value.language,
          description: value.description
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code generation failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Schema generation
router.post('/generate-schema', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = schemaGenerationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const response = await AIService.generateSchema(value.description);
    
    // Try to parse the generated schema JSON
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(response.content);
    } catch {
      parsedSchema = response.content; // Return as string if not valid JSON
    }
    
    res.json({
      success: true,
      data: {
        schema: parsedSchema,
        rawContent: response.content,
        model: response.model,
        usage: response.usage
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema generation failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// Code explanation
router.post('/explain-code', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = explainCodeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const response = await AIService.explainCode(value.code);
    
    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code explanation failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// AI health check
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const health = await AIService.healthCheck();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// List available models
router.get('/models', asyncHandler(async (req: Request, res: Response) => {
  const models = {
    groq: {
      available: !!process.env.GROQ_API_KEY,
      models: ['mixtral-8x7b-32768', 'llama2-70b-4096', 'gemma-7b-it']
    },
    openai: {
      available: !!process.env.OPENAI_API_KEY,
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
    bedrock: {
      available: true, // Available through AWS
      models: ['anthropic.claude-3-sonnet-20240229-v1:0', 'anthropic.claude-3-haiku-20240307-v1:0']
    }
  };

  res.json({
    success: true,
    data: models,
    timestamp: new Date().toISOString()
  });
}));

export default router;
