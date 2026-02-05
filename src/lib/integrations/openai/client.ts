import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY;
  
  if (!key) {
    throw new Error('OpenAI API Key não configurada');
  }

  if (!openaiClient || apiKey) {
    openaiClient = new OpenAI({
      apiKey: key
    });
  }

  return openaiClient;
}

export async function testOpenAIConnection(apiKey: string): Promise<boolean> {
  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}

// Configurações de modelos
export const OPENAI_MODELS = {
  chat: 'gpt-4-turbo-preview',
  embedding: 'text-embedding-3-small',
  analysis: 'gpt-4-turbo-preview'
} as const;

// Configurações de tokens
export const TOKEN_LIMITS = {
  chat: 4096,
  analysis: 8192,
  embedding: 8191
} as const;






