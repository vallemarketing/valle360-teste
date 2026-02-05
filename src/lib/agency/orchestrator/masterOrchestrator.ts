/**
 * Master Orchestrator - Main entry point for the Predictive Agency
 * Coordinates all crews and manages the content generation pipeline
 */

import { 
  OrchestratorRequest, 
  OrchestratorResponse, 
  FocusGroupResult,
  PersonaEvaluation,
} from '../core/types';
import { analyzeDemand } from './demandAnalyzer';
import { buildCrew, buildFocusGroupCrew } from './crewBuilder';
import { getBrandContext } from '../brandMemory';

const MAX_FOCUS_GROUP_ITERATIONS = 3;
const DEFAULT_MIN_SCORE = 7;

export class MasterOrchestrator {
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * Main orchestration method - handles the entire content generation pipeline
   */
  async orchestrate(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Step 1: Get brand context
      const brandContext = await getBrandContext(this.clientId);

      // Step 2: Analyze demand
      const analysis = analyzeDemand(request);

      // Step 3: Build and execute crew
      const { crew, agents } = buildCrew(
        analysis,
        this.clientId,
        request.topic,
        request.objective
      );

      // Execute with brand context
      const crewResult = await crew.kickoff(brandContext || '');

      if (!crewResult.success) {
        throw new Error(crewResult.error || 'Crew execution failed');
      }

      // Step 4: Parse outputs
      const outputs = this.parseOutputs(crewResult.finalOutput, request.demandType);

      // Step 5: Focus Group validation (if required)
      let focusGroupResult: FocusGroupResult | undefined;
      if (analysis.requiresFocusGroup || request.useFocusGroup) {
        focusGroupResult = await this.runFocusGroup(
          outputs,
          request.minFocusGroupScore ?? DEFAULT_MIN_SCORE
        );
      }

      return {
        success: true,
        requestId,
        demandType: request.demandType,
        crewUsed: analysis.crewRecommended,
        agentsInvolved: agents.map(a => a.name),
        outputs,
        focusGroupResult,
        executionTime: Date.now() - startTime,
        tokenUsage: crewResult.totalTokens,
      };
    } catch (error: any) {
      return {
        success: false,
        requestId,
        demandType: request.demandType,
        crewUsed: '',
        agentsInvolved: [],
        outputs: {},
        executionTime: Date.now() - startTime,
        tokenUsage: 0,
      };
    }
  }

  /**
   * Run focus group validation with refinement loop
   */
  private async runFocusGroup(
    outputs: OrchestratorResponse['outputs'],
    minScore: number
  ): Promise<FocusGroupResult> {
    let currentOutputs = outputs;
    let iterations = 0;
    let evaluations: PersonaEvaluation[] = [];
    let averageScore = 0;

    while (iterations < MAX_FOCUS_GROUP_ITERATIONS) {
      iterations++;

      // Build and run focus group crew
      const { crew } = buildFocusGroupCrew(this.clientId);
      
      const contentToEvaluate = this.formatOutputsForReview(currentOutputs);
      const result = await crew.kickoff(contentToEvaluate);

      // Parse evaluations
      evaluations = this.parseEvaluations(result.finalOutput);
      averageScore = this.calculateAverageScore(evaluations);

      // Check if passed
      if (averageScore >= minScore) {
        return {
          averageScore,
          passed: true,
          iterations,
          evaluations,
        };
      }

      // If not passed and we have more iterations, the feedback is used in next iteration
      // In a real implementation, we would refine the content based on feedback
      console.log(`Focus group iteration ${iterations}: Score ${averageScore} < ${minScore}`);
    }

    return {
      averageScore,
      passed: averageScore >= minScore,
      iterations,
      evaluations,
    };
  }

  /**
   * Parse the crew output into structured outputs
   */
  private parseOutputs(
    rawOutput: string,
    demandType: string
  ): OrchestratorResponse['outputs'] {
    // Extract different parts from the raw output
    const outputs: OrchestratorResponse['outputs'] = {};

    // Try to extract strategy section
    const strategyMatch = rawOutput.match(/(?:estratég|briefing|análise)[^]*?(?=\n\n---|\n\n\[|$)/i);
    if (strategyMatch) {
      outputs.strategy = strategyMatch[0].trim();
    }

    // Try to extract copy section
    const copyMatch = rawOutput.match(/(?:copy|legenda|texto|post)[^]*?(?=\n\n---|\n\n\[|$)/i);
    if (copyMatch) {
      outputs.copy = copyMatch[0].trim();
    }

    // Try to extract hashtags
    const hashtagMatch = rawOutput.match(/#[^\s#]+/g);
    if (hashtagMatch) {
      outputs.hashtags = hashtagMatch.slice(0, 15);
    }

    // Try to extract visual prompt
    const visualMatch = rawOutput.match(/(?:prompt|visual|arte|design)[^]*?(?=\n\n---|\n\n\[|$)/i);
    if (visualMatch) {
      outputs.visualPrompt = visualMatch[0].trim();
    }

    // Try to extract CTA
    const ctaMatch = rawOutput.match(/(?:cta|call.to.action|chamada)[^]*?(?=\n\n---|\n\n\[|$)/i);
    if (ctaMatch) {
      outputs.cta = ctaMatch[0].trim();
    }

    // If no specific sections found, use full output
    if (Object.keys(outputs).length === 0) {
      outputs.copy = rawOutput;
    }

    return outputs;
  }

  private formatOutputsForReview(outputs: OrchestratorResponse['outputs']): string {
    const parts: string[] = [];

    if (outputs.strategy) {
      parts.push(`ESTRATÉGIA:\n${outputs.strategy}`);
    }
    if (outputs.copy) {
      parts.push(`COPY:\n${outputs.copy}`);
    }
    if (outputs.hashtags?.length) {
      parts.push(`HASHTAGS:\n${outputs.hashtags.join(' ')}`);
    }
    if (outputs.visualPrompt) {
      parts.push(`VISUAL:\n${outputs.visualPrompt}`);
    }
    if (outputs.cta) {
      parts.push(`CTA:\n${outputs.cta}`);
    }

    return parts.join('\n\n---\n\n');
  }

  private parseEvaluations(rawOutput: string): PersonaEvaluation[] {
    const evaluations: PersonaEvaluation[] = [];
    
    // Try to parse JSON evaluations from the output
    const jsonMatches = rawOutput.match(/\{[^{}]*"nota"[^{}]*\}/g);
    
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          evaluations.push({
            personaId: parsed.persona_id || 'unknown',
            personaName: parsed.persona_name || 'Unknown',
            score: parsed.nota || 5,
            positives: parsed.pontos_positivos || [],
            negatives: parsed.pontos_negativos || [],
            suggestions: parsed.sugestoes || [],
            verdict: parsed.veredicto || 'precisa_ajustes',
          });
        } catch {
          // If JSON parsing fails, try to extract score manually
          const scoreMatch = match.match(/"nota"\s*:\s*(\d+)/);
          if (scoreMatch) {
            evaluations.push({
              personaId: 'unknown',
              personaName: 'Unknown',
              score: parseInt(scoreMatch[1]),
              positives: [],
              negatives: [],
              suggestions: [],
              verdict: 'precisa_ajustes',
            });
          }
        }
      }
    }

    return evaluations;
  }

  private calculateAverageScore(evaluations: PersonaEvaluation[]): number {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, e) => acc + e.score, 0);
    return sum / evaluations.length;
  }
}

/**
 * Factory function to create orchestrator instance
 */
export function createOrchestrator(clientId: string): MasterOrchestrator {
  return new MasterOrchestrator(clientId);
}

/**
 * Execute a crew job (for task queue workers)
 */
export async function executeCrew(
  crewType: string,
  clientId: string,
  params: any,
  options?: {
    onProgress?: (percent: number, step: string, message?: string) => Promise<void>;
  }
): Promise<any> {
  const orchestrator = createOrchestrator(clientId);
  
  // Construir request baseado no tipo de crew
  const request: any = {
    clientId,
    demandType: crewType === 'test_campaign' ? 'marketing_campaign' : params.demandType || 'social_media_post',
    topic: params.topic || params.campaignName || 'Conteúdo de teste',
    tone: params.tone || 'profissional',
    targetAudience: params.targetAudience || 'público geral',
    additionalContext: params.additionalContext || '',
  };
  
  return await orchestrator.orchestrate(request);
}
