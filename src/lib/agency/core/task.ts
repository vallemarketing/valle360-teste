/**
 * Task Class for the Predictive Agency
 */

import { Agent } from './agent';
import { TaskConfig, AgentExecutionResult } from './types';

export class Task {
  public id: string;
  public description: string;
  public expectedOutput: string;
  public agentId: string;
  public context?: string;
  public dependencies?: string[];

  private agent?: Agent | any;
  private result?: AgentExecutionResult;

  constructor(config: TaskConfig) {
    this.id = config.id;
    this.description = config.description;
    this.expectedOutput = config.expectedOutput;
    this.agentId = config.agentId;
    this.context = config.context;
    this.dependencies = config.dependencies;
  }

  /**
   * Assign an agent to this task
   */
  assignAgent(agent: Agent | any): void {
    this.agent = agent;
    this.agentId = agent.id;
  }

  /**
   * Execute the task with the assigned agent
   */
  async execute(additionalContext?: string): Promise<AgentExecutionResult> {
    if (!this.agent) {
      throw new Error(`Task ${this.id} has no assigned agent`);
    }

    const fullContext = [
      this.context,
      additionalContext,
      `OUTPUT ESPERADO: ${this.expectedOutput}`,
    ].filter(Boolean).join('\n\n');

    this.result = await this.agent.execute(this.description, fullContext);
    
    if (!this.result) {
      throw new Error(`Task ${this.id} execution returned undefined result`);
    }
    
    return this.result;
  }

  /**
   * Get the result of this task
   */
  getResult(): AgentExecutionResult | undefined {
    return this.result;
  }
}
