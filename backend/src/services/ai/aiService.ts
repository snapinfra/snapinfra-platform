import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { InvokeModelCommand, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient, BEDROCK_CONFIG } from '@/utils/awsConfig';
import { AIRequest, AIResponse, AIStreamChunk, AIGenerationOptions } from '@/types';

// Initialize AI clients
const groqClient = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY
}) : null;

const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

export class AIService {
  // Main AI generation method - routes to best available model
  static async generate(request: AIRequest): Promise<AIResponse> {
    const { prompt, systemMessage, options = {} } = request;

    // Default options
    const defaultOptions: AIGenerationOptions = {
      model: 'auto',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      reasoningEffort: 'medium'
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // Route to appropriate service based on model or availability
      if (finalOptions.model?.startsWith('claude') || finalOptions.model === 'bedrock') {
        return await this.generateWithBedrock(prompt, systemMessage, finalOptions);
      } else if (finalOptions.model?.startsWith('gpt') || finalOptions.model === 'openai') {
        return await this.generateWithOpenAI(prompt, systemMessage, finalOptions);
      } else if (finalOptions.model?.includes('groq') || finalOptions.model === 'groq') {
        return await this.generateWithGroq(prompt, systemMessage, finalOptions);
      } else {
        // Auto-select best available service
        if (groqClient) {
          return await this.generateWithGroq(prompt, systemMessage, finalOptions);
        } else if (openaiClient) {
          return await this.generateWithOpenAI(prompt, systemMessage, finalOptions);
        } else {
          return await this.generateWithBedrock(prompt, systemMessage, finalOptions);
        }
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Streaming AI generation
  static async* generateStream(request: AIRequest): AsyncGenerator<AIStreamChunk> {
    const { prompt, systemMessage, options = {} } = request;
    
    try {
      // Route to streaming service
      if (options.model?.startsWith('claude') || options.model === 'bedrock') {
        yield* this.generateStreamWithBedrock(prompt, systemMessage, options);
      } else if (options.model?.startsWith('gpt') || options.model === 'openai') {
        yield* this.generateStreamWithOpenAI(prompt, systemMessage, options);
      } else if (groqClient) {
        yield* this.generateStreamWithGroq(prompt, systemMessage, options);
      } else if (openaiClient) {
        yield* this.generateStreamWithOpenAI(prompt, systemMessage, options);
      } else {
        yield* this.generateStreamWithBedrock(prompt, systemMessage, options);
      }
    } catch (error) {
      yield {
        content: '',
        isComplete: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Groq implementation
  private static async generateWithGroq(
    prompt: string,
    systemMessage?: string,
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    if (!groqClient) {
      throw new Error('Groq client not initialized. Check GROQ_API_KEY environment variable.');
    }

    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system' as const, content: systemMessage });
    }
    messages.push({ role: 'user' as const, content: prompt });

    const response = await groqClient.chat.completions.create({
      model: 'mixtral-8x7b-32768', // Default Groq model
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 1
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      model: response.model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      finishReason: choice.finish_reason || undefined
    };
  }

  // Groq streaming
  private static async* generateStreamWithGroq(
    prompt: string,
    systemMessage?: string,
    options?: AIGenerationOptions
  ): AsyncGenerator<AIStreamChunk> {
    if (!groqClient) {
      throw new Error('Groq client not initialized');
    }

    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system' as const, content: systemMessage });
    }
    messages.push({ role: 'user' as const, content: prompt });

    const stream = await groqClient.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const isComplete = chunk.choices[0]?.finish_reason !== null;

      yield {
        content,
        isComplete
      };

      if (isComplete) break;
    }
  }

  // OpenAI implementation
  private static async generateWithOpenAI(
    prompt: string,
    systemMessage?: string,
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized. Check OPENAI_API_KEY environment variable.');
    }

    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system' as const, content: systemMessage });
    }
    messages.push({ role: 'user' as const, content: prompt });

    const response = await openaiClient.chat.completions.create({
      model: options?.model?.includes('gpt') ? options.model : 'gpt-4o-mini',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 1
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      model: response.model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      finishReason: choice.finish_reason || undefined
    };
  }

  // OpenAI streaming
  private static async* generateStreamWithOpenAI(
    prompt: string,
    systemMessage?: string,
    options?: AIGenerationOptions
  ): AsyncGenerator<AIStreamChunk> {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system' as const, content: systemMessage });
    }
    messages.push({ role: 'user' as const, content: prompt });

    const stream = await openaiClient.chat.completions.create({
      model: options?.model?.includes('gpt') ? options.model : 'gpt-4o-mini',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const isComplete = chunk.choices[0]?.finish_reason !== null;

      yield {
        content,
        isComplete
      };

      if (isComplete) break;
    }
  }

  // AWS Bedrock implementation
  private static async generateWithBedrock(
    prompt: string,
    systemMessage?: string,
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    const messages = [];
    if (systemMessage) {
      messages.push({
        role: 'user',
        content: `System: ${systemMessage}\n\nUser: ${prompt}`
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt
      });
    }

    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP ?? 1,
      messages
    };

    const command = new InvokeModelCommand({
      modelId: BEDROCK_CONFIG.MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      content: responseBody.content[0]?.text || '',
      model: BEDROCK_CONFIG.MODEL_ID,
      usage: responseBody.usage ? {
        promptTokens: responseBody.usage.input_tokens,
        completionTokens: responseBody.usage.output_tokens,
        totalTokens: responseBody.usage.input_tokens + responseBody.usage.output_tokens
      } : undefined,
      finishReason: responseBody.stop_reason
    };
  }

  // AWS Bedrock streaming
  private static async* generateStreamWithBedrock(
    prompt: string,
    systemMessage?: string,
    options?: AIGenerationOptions
  ): AsyncGenerator<AIStreamChunk> {
    const messages = [];
    if (systemMessage) {
      messages.push({
        role: 'user',
        content: `System: ${systemMessage}\n\nUser: ${prompt}`
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt
      });
    }

    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP ?? 1,
      messages
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: BEDROCK_CONFIG.MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body)
    });

    const response = await bedrockClient.send(command);

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
          
          if (chunk.type === 'content_block_delta') {
            yield {
              content: chunk.delta?.text || '',
              isComplete: false
            };
          } else if (chunk.type === 'message_stop') {
            yield {
              content: '',
              isComplete: true
            };
            break;
          }
        }
      }
    }
  }

  // Specialized methods for different use cases
  static async generateCode(
    description: string,
    framework: string,
    language: string = 'typescript'
  ): Promise<AIResponse> {
    const systemMessage = `You are an expert backend developer. Generate clean, production-ready ${language} code using ${framework}. Include proper error handling, validation, and TypeScript types. Follow best practices and modern conventions.`;

    const prompt = `Generate a ${framework} backend implementation for: ${description}

Requirements:
- Use ${language}
- Include proper TypeScript types
- Add error handling and validation
- Follow REST API best practices
- Include comments explaining the code
- Make it production-ready`;

    return this.generate({
      prompt,
      systemMessage,
      options: {
        temperature: 0.3, // Lower temperature for more consistent code
        maxTokens: 4096
      }
    });
  }

  static async generateSchema(description: string): Promise<AIResponse> {
    const systemMessage = `You are a database architect. Generate optimal database schemas with proper relationships, indexes, and constraints. Return the schema in JSON format.`;

    const prompt = `Design a database schema for: ${description}

Requirements:
- Return valid JSON schema format
- Include tables, fields, relationships, and indexes
- Add appropriate constraints and data types
- Consider performance and scalability
- Include foreign key relationships where appropriate`;

    return this.generate({
      prompt,
      systemMessage,
      options: {
        temperature: 0.2,
        maxTokens: 3072
      }
    });
  }

  static async explainCode(code: string): Promise<AIResponse> {
    const systemMessage = `You are a code reviewer and technical writer. Analyze code and provide clear, detailed explanations suitable for developers of all levels.`;

    const prompt = `Analyze and explain this code:

\`\`\`
${code}
\`\`\`

Please provide:
1. Overall purpose and functionality
2. Key components and their roles
3. Code structure and patterns used
4. Potential improvements or concerns
5. How it fits into a larger application`;

    return this.generate({
      prompt,
      systemMessage,
      options: {
        temperature: 0.4,
        maxTokens: 2048
      }
    });
  }

  // Health check for AI services
  static async healthCheck(): Promise<{
    groq: boolean;
    openai: boolean;
    bedrock: boolean;
    available: string[];
  }> {
    const health = {
      groq: false,
      openai: false,
      bedrock: false,
      available: [] as string[]
    };

    // Test Groq
    try {
      if (groqClient) {
        await groqClient.chat.completions.create({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        });
        health.groq = true;
        health.available.push('groq');
      }
    } catch (error) {
      // Groq not available
    }

    // Test OpenAI
    try {
      if (openaiClient) {
        await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        });
        health.openai = true;
        health.available.push('openai');
      }
    } catch (error) {
      // OpenAI not available
    }

    // Test Bedrock
    try {
      const command = new InvokeModelCommand({
        modelId: BEDROCK_CONFIG.MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      await bedrockClient.send(command);
      health.bedrock = true;
      health.available.push('bedrock');
    } catch (error) {
      // Bedrock not available
    }

    return health;
  }
}