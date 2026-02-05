/**
 * Base Agent Class for the Predictive Agency
 */

import OpenAI from 'openai';
import { AgentConfig, AgentExecutionResult, AgentTool } from './types';

export class Agent {
  public id: string;
  public name: string;
  public role: string;
  public goal: string;
  public backstory: string;
  public model: string;
  public temperature: number;
  public maxTokens: number;
  public tools: AgentTool[];

  private openai: OpenAI;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.goal = config.goal;
    this.backstory = config.backstory;
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2000;
    this.tools = config.tools ?? [];

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Execute a task with this agent
   */
  async execute(taskDescription: string, context?: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(taskDescription, context);

    try {
      // If agent has tools, we might need to call them
      let toolResults = '';
      if (this.tools.length > 0 && context) {
        // Execute relevant tools to gather context
        for (const tool of this.tools) {
          try {
            const result = await tool.execute({ query: taskDescription });
            if (result) {
              toolResults += `\n\n[${tool.name}]:\n${result}`;
            }
          } catch (e) {
            console.warn(`Tool ${tool.name} failed:`, e);
          }
        }
      }

      const finalUserPrompt = toolResults 
        ? `${userPrompt}\n\n--- INFORMAÇÕES RELEVANTES ---${toolResults}`
        : userPrompt;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalUserPrompt },
        ],
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
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        agentId: this.id,
        agentName: this.name,
        output: `Erro na execução: ${error.message}`,
        executionTime,
      };
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
- Seja direto e objetivo
- Use sua expertise para entregar resultados de alta qualidade
- Se precisar de mais informações, especifique claramente`;
  }

  private buildUserPrompt(taskDescription: string, context?: string): string {
    let prompt = `TAREFA:\n${taskDescription}`;
    
    if (context) {
      prompt += `\n\nCONTEXTO ADICIONAL:\n${context}`;
    }

    return prompt;
  }
}
