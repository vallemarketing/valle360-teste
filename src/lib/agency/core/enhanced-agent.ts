/**
 * Enhanced Agent Class
 * Agent com reflexão, self-correction, retry logic e circuit breaker
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AgentConfig, AgentExecutionResult, AgentTool } from './types';
import { CircuitBreaker, openaiCircuitBreaker, anthropicCircuitBreaker } from './circuit-breaker';
import { shortTermMemory } from '../memory/short-term-memory';

export interface ReflectionResult {
  needsCorrection: boolean;
  issues: string[];
  score: number; // 0-10
  suggestions: string[];
  confidence: number; // 0-100%
}

export interface EnhancedAgentConfig extends AgentConfig {
  enableReflection?: boolean;
  enableSelfCorrection?: boolean;
  maxRetries?: number;
  fallbackModel?: 'claude' | 'gpt-4o-mini';
  contextWindowSize?: number;
}

export class EnhancedAgent {
  public id: string;
  public name: string;
  public role: string;
  public goal: string;
  public backstory: string;
  public model: string;
  public temperature: number;
  public maxTokens: number;
  public tools: AgentTool[];
  
  // Enhanced features
  private enableReflection: boolean;
  private enableSelfCorrection: boolean;
  private maxRetries: number;
  private fallbackModel?: string;
  private contextWindowSize: number;
  
  // LLM clients
  private openai: OpenAI;
  private anthropic: Anthropic;
  
  // Last execution state
  private lastTask?: string;
  private lastResult?: AgentExecutionResult;
  private executionHistory: AgentExecutionResult[] = [];
  
  constructor(config: EnhancedAgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.goal = config.goal;
    this.backstory = config.backstory;
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2000;
    this.tools = config.tools ?? [];
    
    // Enhanced config
    this.enableReflection = config.enableReflection ?? true;
    this.enableSelfCorrection = config.enableSelfCorrection ?? true;
    this.maxRetries = config.maxRetries ?? 3;
    this.fallbackModel = config.fallbackModel;
    this.contextWindowSize = config.contextWindowSize ?? 8000;
    
    // Initialize LLM clients
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  /**
   * Execute task with enhanced features:
   * - Load short-term memory
   * - Execute with circuit breaker and retry
   * - Self-reflection
   * - Self-correction if needed
   * - Store in memory
   */
  async execute(taskDescription: string, context?: string): Promise<AgentExecutionResult> {
    this.lastTask = taskDescription;
    const startTime = Date.now();
    
    try {
      // 1. Load short-term memory
      const memoryContext = await this.loadMemory();
      
      // 2. Manage context window (compress if needed)
      const managedContext = this.manageContextWindow(context, memoryContext);
      
      // 3. Execute with circuit breaker and retry
      let result = await this.executeWithRetry(taskDescription, managedContext);
      
      // 4. Self-reflection
      if (this.enableReflection) {
        const reflection = await this.reflect(result);
        
        // 5. Self-correction if needed
        if (reflection.needsCorrection && this.enableSelfCorrection) {
          console.log(`[${this.name}] Self-correction needed. Issues: ${reflection.issues.join(', ')}`);
          result = await this.correct(result, reflection);
        }
        
        // Add reflection metadata
        result.reflection = reflection;
      }
      
      // 6. Store in memory
      await this.storeInMemory(result);
      
      // 7. Store in execution history
      this.executionHistory.push(result);
      this.lastResult = result;
      
      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorResult: AgentExecutionResult = {
        agentId: this.id,
        agentName: this.name,
        output: `Erro fatal na execução: ${error.message}`,
        executionTime,
        error: error.message,
      };
      
      this.executionHistory.push(errorResult);
      return errorResult;
    }
  }
  
  /**
   * Execute with retry logic and exponential backoff
   */
  private async executeWithRetry(
    task: string,
    context?: string,
    attempt: number = 1
  ): Promise<AgentExecutionResult> {
    try {
      return await this.executeLLM(task, context);
    } catch (error: any) {
      if (attempt >= this.maxRetries) {
        // Try fallback model if available
        if (this.fallbackModel) {
          console.log(`[${this.name}] Trying fallback model: ${this.fallbackModel}`);
          return await this.executeFallback(task, context);
        }
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[${this.name}] Retry attempt ${attempt}/${this.maxRetries}. Waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return await this.executeWithRetry(task, context, attempt + 1);
    }
  }
  
  /**
   * Execute LLM with circuit breaker
   */
  private async executeLLM(task: string, context?: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    // Build prompts
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(task, context);
    
    // Execute tools if available
    let toolResults = '';
    if (this.tools.length > 0) {
      toolResults = await this.executeTools(task, context);
    }
    
    const finalUserPrompt = toolResults
      ? `${userPrompt}\n\n--- INFORMAÇÕES RELEVANTES (Tools) ---\n${toolResults}`
      : userPrompt;
    
    // Execute with circuit breaker
    const response = await openaiCircuitBreaker.execute(async () => {
      return await this.openai.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalUserPrompt },
        ],
      });
    });
    
    const output = response.choices[0]?.message?.content ?? '';
    const executionTime = Date.now() - startTime;
    
    return {
      agentId: this.id,
      agentName: this.name,
      output,
      tokenUsage: {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0,
      },
      executionTime,
    };
  }
  
  /**
   * Execute fallback model (Claude)
   */
  private async executeFallback(task: string, context?: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(task, context);
    
    const response = await anthropicCircuitBreaker.execute(async () => {
      return await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      });
    });
    
    const output = response.content[0].type === 'text' ? response.content[0].text : '';
    const executionTime = Date.now() - startTime;
    
    return {
      agentId: this.id,
      agentName: this.name,
      output,
      tokenUsage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      executionTime,
      fallbackUsed: true,
    };
  }
  
  /**
   * Self-reflection: Agent evaluates its own response
   */
  private async reflect(result: AgentExecutionResult): Promise<ReflectionResult> {
    const reflectionPrompt = `Você é um revisor crítico especializado em ${this.role}.

TAREFA ORIGINAL:
${this.lastTask}

RESPOSTA DO AGENTE:
${result.output}

OBJETIVO DO AGENTE:
${this.goal}

Avalie criticamente esta resposta considerando:
1. **Clareza**: Está clara e bem estruturada?
2. **Completude**: Atende todos os requisitos da tarefa?
3. **Qualidade**: Demonstra expertise no assunto?
4. **Erros**: Há erros lógicos, inconsistências ou imprecisões?
5. **Alinhamento**: Está alinhada com o objetivo do agente?

Responda APENAS com um JSON válido no formato:
{
  "needsCorrection": boolean,
  "issues": ["issue 1", "issue 2"],
  "score": number (0-10),
  "suggestions": ["sugestão 1", "sugestão 2"],
  "confidence": number (0-100)
}`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.3, // Mais determinístico para avaliação
        messages: [
          { role: 'user', content: reflectionPrompt },
        ],
        response_format: { type: 'json_object' },
      });
      
      const reflection = JSON.parse(response.choices[0].message.content || '{}');
      return reflection as ReflectionResult;
    } catch (error) {
      console.error(`[${this.name}] Reflection failed:`, error);
      // Retorna reflexão padrão em caso de erro
      return {
        needsCorrection: false,
        issues: [],
        score: 7,
        suggestions: [],
        confidence: 50,
      };
    }
  }
  
  /**
   * Self-correction: Agent corrects its own response based on reflection
   */
  private async correct(
    originalResult: AgentExecutionResult,
    reflection: ReflectionResult
  ): Promise<AgentExecutionResult> {
    const correctionPrompt = `Você é ${this.name}, especializado em ${this.role}.

TAREFA ORIGINAL:
${this.lastTask}

SUA RESPOSTA ANTERIOR:
${originalResult.output}

PROBLEMAS IDENTIFICADOS:
${reflection.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

SUGESTÕES DE MELHORIA:
${reflection.suggestions.map((sug, i) => `${i + 1}. ${sug}`).join('\n')}

Por favor, CORRIJA e MELHORE sua resposta anterior, resolvendo todos os problemas identificados.
Mantenha o mesmo formato e estrutura, mas com melhor qualidade.`;
    
    const startTime = Date.now();
    
    const response = await this.openai.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: correctionPrompt },
      ],
    });
    
    const output = response.choices[0]?.message?.content ?? originalResult.output;
    const executionTime = Date.now() - startTime;
    
    return {
      agentId: this.id,
      agentName: this.name,
      output,
      tokenUsage: {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0,
      },
      executionTime,
      corrected: true,
      originalOutput: originalResult.output,
    };
  }
  
  /**
   * Execute all tools and compile results
   */
  private async executeTools(task: string, context?: string): Promise<string> {
    const toolResults: string[] = [];
    
    for (const tool of this.tools) {
      try {
        const result = await tool.execute({ query: task, context });
        if (result) {
          toolResults.push(`[${tool.name}]:\n${result}`);
        }
      } catch (error: any) {
        console.warn(`[${this.name}] Tool ${tool.name} failed:`, error.message);
      }
    }
    
    return toolResults.join('\n\n');
  }
  
  /**
   * Manage context window size
   * Compresses old context if exceeds limit
   */
  private manageContextWindow(currentContext?: string, memoryContext?: any): string {
    let fullContext = '';
    
    if (memoryContext) {
      fullContext += JSON.stringify(memoryContext, null, 2) + '\n\n';
    }
    
    if (currentContext) {
      fullContext += currentContext;
    }
    
    // Se exceder limite, comprimir
    if (fullContext.length > this.contextWindowSize) {
      console.log(`[${this.name}] Context too large (${fullContext.length} chars). Compressing...`);
      // Mantem apenas os últimos N caracteres
      fullContext = '...(contexto anterior comprimido)...\n\n' + 
        fullContext.slice(-this.contextWindowSize);
    }
    
    return fullContext;
  }
  
  /**
   * Load short-term memory for this agent
   */
  private async loadMemory(): Promise<any> {
    try {
      return await shortTermMemory.get(this.id);
    } catch (error) {
      console.warn(`[${this.name}] Failed to load memory:`, error);
      return null;
    }
  }
  
  /**
   * Store execution result in short-term memory
   */
  private async storeInMemory(result: AgentExecutionResult): Promise<void> {
    try {
      await shortTermMemory.set(this.id, {
        lastTask: this.lastTask,
        lastResult: result,
        timestamp: new Date().toISOString(),
      }, 3600); // 1 hora TTL
    } catch (error) {
      console.warn(`[${this.name}] Failed to store in memory:`, error);
    }
  }
  
  private buildSystemPrompt(): string {
    return `Você é ${this.name}, um profissional especializado em ${this.role}.

SEU OBJETIVO:
${this.goal}

SUA HISTÓRIA/CONTEXTO:
${this.backstory}

INSTRUÇÕES:
- Responda sempre em português brasileiro
- Seja direto, objetivo e profissional
- Use sua expertise para entregar resultados de alta qualidade
- Se precisar de mais informações, especifique claramente
- Formate suas respostas de forma clara e estruturada`;
  }
  
  private buildUserPrompt(taskDescription: string, context?: string): string {
    let prompt = `TAREFA:\n${taskDescription}`;
    
    if (context) {
      prompt += `\n\nCONTEXTO ADICIONAL:\n${context}`;
    }
    
    return prompt;
  }
  
  /**
   * Get execution history
   */
  getHistory(): AgentExecutionResult[] {
    return this.executionHistory;
  }
  
  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }
}
