/**
 * Enhanced Crew Class
 * Crew com execução paralela, hierárquica e dynamic re-planning
 */

import { EnhancedAgent } from './enhanced-agent';
import { Task } from './task';
import { CrewConfig, CrewExecutionResult, AgentExecutionResult } from './types';
import { shortTermMemory } from '../memory/short-term-memory';

export interface EnhancedCrewConfig extends CrewConfig {
  process?: 'sequential' | 'parallel' | 'hierarchical';
  maxParallelTasks?: number;
  enableDynamicReplanning?: boolean;
  humanInTheLoop?: boolean;
  humanApprovalSteps?: string[]; // Task IDs que precisam de aprovação humana
}

export class EnhancedCrew {
  public id: string;
  public name: string;
  public description: string;
  public process: 'sequential' | 'parallel' | 'hierarchical';
  
  private agents: Map<string, EnhancedAgent> = new Map();
  private tasks: Task[] = [];
  private maxParallelTasks: number;
  private enableDynamicReplanning: boolean;
  private humanInTheLoop: boolean;
  private humanApprovalSteps: string[];
  
  // Execution state
  private currentContext: string = '';
  private failedTasks: Task[] = [];
  private completedTasks: Set<string> = new Set();
  
  constructor(config: EnhancedCrewConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.process = config.process ?? 'sequential';
    this.maxParallelTasks = config.maxParallelTasks ?? 5;
    this.enableDynamicReplanning = config.enableDynamicReplanning ?? true;
    this.humanInTheLoop = config.humanInTheLoop ?? false;
    this.humanApprovalSteps = config.humanApprovalSteps ?? [];
  }
  
  /**
   * Add an agent to the crew
   */
  addAgent(agent: EnhancedAgent): void {
    this.agents.set(agent.id, agent);
  }
  
  /**
   * Add a task to the crew
   */
  addTask(task: Task): void {
    const agent = this.agents.get(task.agentId);
    if (agent) {
      task.assignAgent(agent);
    }
    this.tasks.push(task);
  }
  
  /**
   * Execute all tasks based on process type
   */
  async kickoff(initialContext?: string): Promise<CrewExecutionResult> {
    const startTime = Date.now();
    this.currentContext = initialContext ?? '';
    this.failedTasks = [];
    this.completedTasks.clear();
    
    console.log(`[EnhancedCrew ${this.name}] Starting execution with ${this.process} process`);
    
    // Store crew context in memory
    await this.storeCrewContext();
    
    try {
      let taskResults: AgentExecutionResult[];
      
      switch (this.process) {
        case 'parallel':
          taskResults = await this.executeParallel();
          break;
        case 'hierarchical':
          taskResults = await this.executeHierarchical();
          break;
        default:
          taskResults = await this.executeSequential();
      }
      
      const finalOutput = this.compileFinalOutput(taskResults);
      const totalTokens = taskResults.reduce((sum, r) => sum + (r.tokenUsage?.total ?? 0), 0);
      const totalTime = Date.now() - startTime;
      
      return {
        crewId: this.id,
        crewName: this.name,
        finalOutput,
        taskResults,
        totalTokens,
        totalTime,
        success: this.failedTasks.length === 0,
        error: this.failedTasks.length > 0 ? `${this.failedTasks.length} tasks failed` : undefined,
      };
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      return {
        crewId: this.id,
        crewName: this.name,
        finalOutput: '',
        taskResults: [],
        totalTokens: 0,
        totalTime,
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Execute tasks sequentially
   */
  private async executeSequential(): Promise<AgentExecutionResult[]> {
    const results: AgentExecutionResult[] = [];
    
    for (const task of this.tasks) {
      // Check for human approval
      if (this.humanInTheLoop && this.humanApprovalSteps.includes(task.id)) {
        console.log(`[EnhancedCrew ${this.name}] Waiting for human approval on task ${task.id}`);
        await this.waitForHumanApproval(task);
      }
      
      try {
        const result = await this.executeTask(task);
        results.push(result);
        this.completedTasks.add(task.id);
        
        // Accumulate context
        this.currentContext += `\n\n[Resultado de ${result.agentName}]:\n${result.output}`;
      } catch (error: any) {
        console.error(`[EnhancedCrew ${this.name}] Task ${task.id} failed:`, error.message);
        this.failedTasks.push(task);
        
        // Dynamic re-planning
        if (this.enableDynamicReplanning) {
          const recoveryResult = await this.attemptRecovery(task, error);
          if (recoveryResult) {
            results.push(recoveryResult);
            this.completedTasks.add(task.id);
            this.currentContext += `\n\n[Resultado recuperado de ${recoveryResult.agentName}]:\n${recoveryResult.output}`;
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Execute tasks in parallel (for independent tasks)
   */
  private async executeParallel(): Promise<AgentExecutionResult[]> {
    const results: AgentExecutionResult[] = [];
    
    // Group tasks by dependencies
    const { independentTasks, dependentTasks } = this.analyzeDependencies();
    
    // Execute independent tasks in parallel (batches of maxParallelTasks)
    for (let i = 0; i < independentTasks.length; i += this.maxParallelTasks) {
      const batch = independentTasks.slice(i, i + this.maxParallelTasks);
      console.log(`[EnhancedCrew ${this.name}] Executing batch of ${batch.length} parallel tasks`);
      
      const batchResults = await Promise.allSettled(
        batch.map(task => this.executeTask(task))
      );
      
      // Process results
      batchResults.forEach((result, index) => {
        const task = batch[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
          this.completedTasks.add(task.id);
          this.currentContext += `\n\n[${result.value.agentName}]: ${result.value.output}`;
        } else {
          console.error(`[EnhancedCrew ${this.name}] Parallel task ${task.id} failed:`, result.reason);
          this.failedTasks.push(task);
        }
      });
    }
    
    // Execute dependent tasks sequentially after their dependencies are met
    for (const task of dependentTasks) {
      if (this.areDependenciesMet(task)) {
        try {
          const result = await this.executeTask(task);
          results.push(result);
          this.completedTasks.add(task.id);
          this.currentContext += `\n\n[${result.agentName}]: ${result.output}`;
        } catch (error: any) {
          console.error(`[EnhancedCrew ${this.name}] Dependent task ${task.id} failed:`, error.message);
          this.failedTasks.push(task);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Execute tasks hierarchically (manager delegates and reviews)
   */
  private async executeHierarchical(): Promise<AgentExecutionResult[]> {
    // Find manager agent (first agent or one with 'manager' in role)
    const managerAgent = Array.from(this.agents.values()).find(
      agent => agent.role.toLowerCase().includes('manager') || agent.role.toLowerCase().includes('head')
    ) || Array.from(this.agents.values())[0];
    
    if (!managerAgent) {
      throw new Error('No manager agent found for hierarchical process');
    }
    
    console.log(`[EnhancedCrew ${this.name}] Manager: ${managerAgent.name}`);
    
    const results: AgentExecutionResult[] = [];
    
    // Manager plans the work
    const planningResult = await managerAgent.execute(
      `Como manager desta crew, analise as seguintes tarefas e crie um plano de execução detalhado:
      
      TAREFAS:
      ${this.tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n')}
      
      CONTEXTO:
      ${this.currentContext}
      
      Forneça um plano estruturado indicando:
      - Ordem de execução
      - Qual agente deve fazer cada tarefa
      - Briefings específicos para cada agente
      - Critérios de qualidade`,
      this.currentContext
    );
    
    results.push(planningResult);
    
    // Execute tasks based on manager's plan
    for (const task of this.tasks) {
      try {
        const result = await this.executeTask(task, planningResult.output);
        results.push(result);
        this.completedTasks.add(task.id);
        
        // Manager reviews the result
        const reviewResult = await managerAgent.execute(
          `Revise o resultado da tarefa "${task.description}":
          
          RESULTADO:
          ${result.output}
          
          Está aprovado? Precisa de ajustes? Dê feedback específico.`,
          this.currentContext
        );
        
        results.push(reviewResult);
        
        // If manager requires adjustments, re-execute
        if (reviewResult.output.toLowerCase().includes('ajuste') || 
            reviewResult.output.toLowerCase().includes('correção')) {
          console.log(`[EnhancedCrew ${this.name}] Manager requested adjustments for task ${task.id}`);
          const adjustedResult = await this.executeTask(task, reviewResult.output);
          results.push(adjustedResult);
        }
        
        this.currentContext += `\n\n[${result.agentName}]: ${result.output}`;
      } catch (error: any) {
        console.error(`[EnhancedCrew ${this.name}] Hierarchical task ${task.id} failed:`, error.message);
        this.failedTasks.push(task);
      }
    }
    
    // Manager compiles final report
    const finalReport = await managerAgent.execute(
      `Como manager, compile um relatório final resumindo:
      - O que foi realizado
      - Qualidade dos resultados
      - Próximos passos recomendados`,
      this.currentContext
    );
    
    results.push(finalReport);
    
    return results;
  }
  
  /**
   * Execute a single task
   */
  private async executeTask(task: Task, additionalContext?: string): Promise<AgentExecutionResult> {
    const agent = this.agents.get(task.agentId);
    if (!agent) {
      throw new Error(`Agent ${task.agentId} not found for task ${task.id}`);
    }
    
    const fullContext = additionalContext 
      ? `${this.currentContext}\n\n${additionalContext}`
      : this.currentContext;
    
    task.assignAgent(agent);
    return await task.execute(fullContext);
  }
  
  /**
   * Attempt recovery from failed task
   */
  private async attemptRecovery(task: Task, error: Error): Promise<AgentExecutionResult | null> {
    console.log(`[EnhancedCrew ${this.name}] Attempting recovery for task ${task.id}`);
    
    // Analyze failure
    const analysisPrompt = `A seguinte tarefa falhou:
    
    TAREFA: ${task.description}
    ERRO: ${error.message}
    CONTEXTO: ${this.currentContext}
    
    Analise o erro e sugira uma abordagem alternativa para completar a tarefa.`;
    
    // Use first available agent to analyze
    const analyzerAgent = Array.from(this.agents.values())[0];
    if (!analyzerAgent) return null;
    
    const analysis = await analyzerAgent.execute(analysisPrompt);
    
    // Try alternative approach
    try {
      const recoveryAgent = this.agents.get(task.agentId);
      if (!recoveryAgent) return null;
      
      const recoveryPrompt = `${task.description}
      
      NOTA: A primeira tentativa falhou. Use esta abordagem alternativa:
      ${analysis.output}`;
      
      return await recoveryAgent.execute(recoveryPrompt, this.currentContext);
    } catch (recoveryError) {
      console.error(`[EnhancedCrew ${this.name}] Recovery also failed for task ${task.id}`);
      return null;
    }
  }
  
  /**
   * Analyze task dependencies
   */
  private analyzeDependencies(): { independentTasks: Task[]; dependentTasks: Task[] } {
    const independentTasks: Task[] = [];
    const dependentTasks: Task[] = [];
    
    for (const task of this.tasks) {
      if (!task.dependencies || task.dependencies.length === 0) {
        independentTasks.push(task);
      } else {
        dependentTasks.push(task);
      }
    }
    
    return { independentTasks, dependentTasks };
  }
  
  /**
   * Check if task dependencies are met
   */
  private areDependenciesMet(task: Task): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    
    return task.dependencies.every(depId => this.completedTasks.has(depId));
  }
  
  /**
   * Wait for human approval (mock implementation)
   */
  private async waitForHumanApproval(task: Task): Promise<void> {
    // Em produção, isso seria uma chamada ao sistema de aprovação
    // Por ora, apenas log
    console.log(`[EnhancedCrew ${this.name}] Human approval required for task: ${task.description}`);
    
    // Store in approval queue (implementar)
    await shortTermMemory.set(`approval:${this.id}:${task.id}`, {
      crewId: this.id,
      crewName: this.name,
      taskId: task.id,
      taskDescription: task.description,
      status: 'pending_approval',
      timestamp: new Date().toISOString(),
    }, 86400); // 24 horas
  }
  
  /**
   * Store crew context in memory
   */
  private async storeCrewContext(): Promise<void> {
    await shortTermMemory.set(`crew:${this.id}`, {
      crewId: this.id,
      crewName: this.name,
      process: this.process,
      tasks: this.tasks.map(t => ({ id: t.id, description: t.description })),
      context: this.currentContext,
      timestamp: new Date().toISOString(),
    }, 3600); // 1 hora
  }
  
  /**
   * Compile final output from all task results
   */
  private compileFinalOutput(taskResults: AgentExecutionResult[]): string {
    const sections: string[] = [];
    
    sections.push(`# ${this.name} - Resultados\n`);
    sections.push(`**Processo:** ${this.process}`);
    sections.push(`**Total de tarefas:** ${this.tasks.length}`);
    sections.push(`**Concluídas:** ${this.completedTasks.size}`);
    sections.push(`**Falharam:** ${this.failedTasks.length}\n`);
    
    sections.push(`## Resultados por Agente\n`);
    
    taskResults.forEach((result, index) => {
      sections.push(`### ${index + 1}. ${result.agentName}`);
      sections.push(result.output);
      
      if (result.reflection) {
        sections.push(`**Score:** ${result.reflection.score}/10`);
        sections.push(`**Confiança:** ${result.reflection.confidence}%`);
      }
      
      if (result.corrected) {
        sections.push(`*(Resposta foi corrigida automaticamente)*`);
      }
      
      sections.push('');
    });
    
    return sections.join('\n');
  }
  
  /**
   * Get crew execution statistics
   */
  getStats() {
    return {
      totalTasks: this.tasks.length,
      completedTasks: this.completedTasks.size,
      failedTasks: this.failedTasks.length,
      successRate: this.completedTasks.size / this.tasks.length,
    };
  }
}
