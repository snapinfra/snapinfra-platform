import { createGroq } from '@ai-sdk/groq';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not defined in environment variables');
}

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const AI_CONFIG = {
  model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
  temperature: Number(process.env.AI_TEMPERATURE) || 1,
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 8192,
  topP: Number(process.env.AI_TOP_P) || 1,
} as const;

export type AIModel = typeof AI_CONFIG.model;
