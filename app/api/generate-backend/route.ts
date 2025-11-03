import { NextRequest, NextResponse } from 'next/server';
import { generateBackend, validateSchemas, validateEndpoints } from '@/lib/ai/backend-generator';
import type { BackendGenerationResult } from '@/lib/ai/backend-generator';

export interface GenerateBackendRequest {
  description: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: GenerateBackendRequest = await request.json();
    
    if (!body.description?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Description is required',
        schemas: [],
        endpoints: [],
        database: 'PostgreSQL',
        description: '',
      }, { status: 400 });
    }

    // Generate backend using AI
    const result: BackendGenerationResult = await generateBackend(
      body.description,
      body.options
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Validate the generated schemas and endpoints
    const schemaValidation = validateSchemas(result.schemas);
    const endpointValidation = validateEndpoints(result.endpoints);

    if (!schemaValidation.isValid) {
      console.warn('Schema validation warnings:', schemaValidation.errors);
    }

    if (!endpointValidation.isValid) {
      console.warn('Endpoint validation warnings:', endpointValidation.errors);
    }

    return NextResponse.json({
      ...result,
      validation: {
        schemas: schemaValidation,
        endpoints: endpointValidation,
      }
    });

  } catch (error) {
    console.error('Generate Backend API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      schemas: [],
      endpoints: [],
      database: 'PostgreSQL',
      description: '',
      timestamp: new Date().toISOString(),
      debug: {
        errorType: typeof error,
        hasStack: error instanceof Error && !!error.stack
      }
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'OK',
    service: 'Backend Generation API',
    description: 'Generate database schemas and API endpoints from natural language descriptions',
    usage: {
      endpoint: 'POST /api/generate-backend',
      body: {
        description: 'Natural language description of your backend requirements',
        options: {
          temperature: 'AI creativity level (0-1, default: 0.7)',
          maxTokens: 'Maximum response length (default: 6000)',
        },
      },
    },
    examples: [
      'A social media platform with users, posts, comments, and likes',
      'An e-commerce store with products, orders, customers, and inventory management',
      'A task management system with projects, tasks, teams, and deadlines',
      'A blog platform with authors, articles, categories, and comments',
    ],
    timestamp: new Date().toISOString(),
  });
}
