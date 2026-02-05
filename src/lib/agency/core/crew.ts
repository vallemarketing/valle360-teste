/**
 * Crew Class for the Predictive Agency
 * Orchestrates multiple agents working together
 */

import { Agent } from './agent';
import { Task } from './task';
import { CrewConfig, CrewExecutionResult, AgentExecutionResult } from './types';

export class Crew {
  public id: string;
  public name: string;
  public description: string;
  public process: 'sequential' | 'parallel' | 'hierarchical';

  private agents: Map<string, Agent> = new Map();
  private tasks: Task[] = [];

  constructor(config: CrewConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.process = config.process ?? 'sequential';
  }

  /**
   * Add an agent to the crew
   */
  addAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Add a task to the crew
   */
  addTask(task: Task): void {
    // Assign agent to task if available
    const agent = this.agents.get(task.agentId);
    if (agent) {
      task.assignAgent(agent);
    }
    this.tasks.push(task);
  }

  /**
   * Execute all tasks in sequence
   */
  async kickoff(initialContext?: string): Promise<CrewExecutionResult> {
    const startTime = Date.now();
    const taskResults: AgentExecutionResult[] = [];
    let totalTokens = 0;
    let accumulatedContext = initialContext ?? '';

    try {
      if (this.process === 'sequential') {
        // Execute tasks in order
        for (const task of this.tasks) {
          const agent = this.agents.get(task.agentId);
          if (!agent) {
            throw new Error(`Agent ${task.agentId} not found for task ${task.id}`);
          }

          task.assignAgent(agent);
          const result = await task.execute(accumulatedContext);
          taskResults.push(result);
          
          // Accumulate context for next task
          accumulatedContext += `\n\n[Resultado de ${agent.name}]:\n${result.output}`;
          totalTokens += result.tokenUsage?.total ?? 0;
        }
      } else {
        // Hierarchical: manager delegates and reviews
        // For now, still execute sequentially but could add manager logic
        for (const task of this.tasks) {
          const agent = this.agents.get(task.agentId);
          if (!agent) {
            throw new Error(`Agent ${task.agentId} not found for task ${task.id}`);
          }

          task.assignAgent(agent);
          const result = await task.execute(accumulatedContext);
          taskResults.push(result);
          
          accumulatedContext += `\n\n[Resultado de ${agent.name}]:\n${result.output}`;
          totalTokens += result.tokenUsage?.total ?? 0;
        }
      }

      const finalOutput = taskResults.map(r => r.output).join('\n\n---\n\n');
      const totalTime = Date.now() - startTime;

      return {
        crewId: this.id,
        crewName: this.name,
        finalOutput,
        taskResults,
        totalTokens,
        totalTime,
        success: true,
      };
    } catch (error: any) {
      return {
        crewId: this.id,
        crewName: this.name,
        finalOutput: '',
        taskResults,
        totalTokens,
        totalTime: Date.now() - startTime,
        success: false,
        error: error.message,
      };
    }
  }
}
