/**
 * Focus Group Crew
 * Crew para validação de conteúdo com personas sintéticas
 */

import { Crew } from '../core/crew';
import { Task } from '../core/task';
import { CrewExecutionResult, FocusGroupResult, PersonaEvaluation } from '../core/types';
import { createBrandGuardian } from '../agents/quality';
import {
  createPersonaSkeptic,
  createPersonaEnthusiast,
  createPersonaBusyExecutive,
} from '../agents/quality';

export interface FocusGroupRequest {
  clientId: string;
  contentToEvaluate: string;
  contentType: string;
  minScore?: number;
  maxIterations?: number;
}

export interface FocusGroupCrewResult extends CrewExecutionResult {
  focusGroupResult: FocusGroupResult;
}

const DEFAULT_MIN_SCORE = 7;
const DEFAULT_MAX_ITERATIONS = 3;

export async function runFocusGroupCrew(
  request: FocusGroupRequest
): Promise<FocusGroupCrewResult> {
  const { 
    clientId, 
    contentToEvaluate, 
    contentType,
    minScore = DEFAULT_MIN_SCORE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
  } = request;

  // Create crew
  const crew = new Crew({
    id: `focus_group_${Date.now()}`,
    name: 'Focus Group Sintético',
    description: `Validação de ${contentType}`,
    agents: [],
    tasks: [],
    process: 'sequential',
  });

  // Add agents
  const brandGuardian = createBrandGuardian(clientId);
  const skeptic = createPersonaSkeptic();
  const enthusiast = createPersonaEnthusiast();
  const executive = createPersonaBusyExecutive();

  crew.addAgent(brandGuardian);
  crew.addAgent(skeptic);
  crew.addAgent(enthusiast);
  crew.addAgent(executive);

  // Create tasks
  const task1 = new Task({
    id: 'brand_validation',
    description: `Valide o seguinte conteúdo contra as diretrizes da marca:

CONTEÚDO:
${contentToEvaluate}

Verifique: tom de voz, vocabulário, valores, identidade visual.
Se houver problemas, liste especificamente o que precisa ser ajustado.`,
    expectedOutput: 'Aprovado ou lista de ajustes com sugestões específicas',
    agentId: brandGuardian.id,
  });

  const task2 = new Task({
    id: 'skeptic_evaluation',
    description: `Como O CÉTICO, avalie o seguinte conteúdo:

CONTEÚDO:
${contentToEvaluate}

Responda em JSON:
{
  "nota": 0-10,
  "pontos_positivos": ["..."],
  "pontos_negativos": ["..."],
  "sugestoes": ["..."],
  "veredicto": "aprovado|reprovado|precisa_ajustes"
}`,
    expectedOutput: 'JSON com avaliação do cético',
    agentId: skeptic.id,
    dependencies: ['brand_validation'],
  });

  const task3 = new Task({
    id: 'enthusiast_evaluation',
    description: `Como O ENTUSIASTA, avalie o seguinte conteúdo:

CONTEÚDO:
${contentToEvaluate}

Responda em JSON:
{
  "nota": 0-10,
  "pontos_positivos": ["..."],
  "pontos_negativos": ["..."],
  "sugestoes": ["..."],
  "veredicto": "aprovado|reprovado|precisa_ajustes"
}`,
    expectedOutput: 'JSON com avaliação do entusiasta',
    agentId: enthusiast.id,
    dependencies: ['brand_validation'],
  });

  const task4 = new Task({
    id: 'executive_evaluation',
    description: `Como O EXECUTIVO OCUPADO, avalie o seguinte conteúdo:

CONTEÚDO:
${contentToEvaluate}

Responda em JSON:
{
  "nota": 0-10,
  "pontos_positivos": ["..."],
  "pontos_negativos": ["..."],
  "sugestoes": ["..."],
  "veredicto": "aprovado|reprovado|precisa_ajustes"
}`,
    expectedOutput: 'JSON com avaliação do executivo',
    agentId: executive.id,
    dependencies: ['brand_validation'],
  });

  crew.addTask(task1);
  crew.addTask(task2);
  crew.addTask(task3);
  crew.addTask(task4);

  // Execute crew
  const crewResult = await crew.kickoff();

  // Parse evaluations from results
  const evaluations = parseEvaluationsFromResults(crewResult.taskResults);
  const averageScore = calculateAverageScore(evaluations);

  const focusGroupResult: FocusGroupResult = {
    averageScore,
    passed: averageScore >= minScore,
    iterations: 1,
    evaluations,
  };

  return {
    ...crewResult,
    focusGroupResult,
  };
}

function parseEvaluationsFromResults(
  taskResults: { agentId: string; agentName: string; output: string }[]
): PersonaEvaluation[] {
  const evaluations: PersonaEvaluation[] = [];

  for (const result of taskResults) {
    // Skip brand guardian (not a persona evaluation)
    if (result.agentId === 'brand_guardian') continue;

    try {
      // Try to extract JSON from output
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        evaluations.push({
          personaId: result.agentId,
          personaName: result.agentName,
          score: parsed.nota || 5,
          positives: parsed.pontos_positivos || [],
          negatives: parsed.pontos_negativos || [],
          suggestions: parsed.sugestoes || [],
          verdict: parsed.veredicto || 'precisa_ajustes',
        });
      }
    } catch {
      // If JSON parsing fails, try to extract score
      const scoreMatch = result.output.match(/nota[:\s]+(\d+)/i);
      evaluations.push({
        personaId: result.agentId,
        personaName: result.agentName,
        score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
        positives: [],
        negatives: [],
        suggestions: [],
        verdict: 'precisa_ajustes',
      });
    }
  }

  return evaluations;
}

function calculateAverageScore(evaluations: PersonaEvaluation[]): number {
  if (evaluations.length === 0) return 0;
  const sum = evaluations.reduce((acc, e) => acc + e.score, 0);
  return Math.round((sum / evaluations.length) * 10) / 10;
}
