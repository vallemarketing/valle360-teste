/**
 * Core Types for the Predictive Agency
 */

export interface AgentTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AgentTool[];
}

export interface TaskConfig {
  id: string;
  description: string;
  expectedOutput: string;
  agentId: string;
  context?: string;
  dependencies?: string[];
}

export interface CrewConfig {
  id: string;
  name: string;
  description: string;
  agents: string[];
  tasks: TaskConfig[];
  process?: 'sequential' | 'parallel' | 'hierarchical';
}

export interface ReflectionResult {
  needsCorrection: boolean;
  issues: string[];
  score: number; // 0-10
  suggestions: string[];
  confidence: number; // 0-100%
}

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  output: string;
  toolCalls?: ToolCallResult[];
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  executionTime: number;
  error?: string;
  reflection?: ReflectionResult;
  corrected?: boolean;
  originalOutput?: string;
  fallbackUsed?: boolean;
}

export interface ToolCallResult {
  toolName: string;
  input: any;
  output: any;
  error?: string;
}

export interface CrewExecutionResult {
  crewId: string;
  crewName: string;
  finalOutput: string;
  taskResults: AgentExecutionResult[];
  totalTokens: number;
  totalTime: number;
  success: boolean;
  error?: string;
}

export interface OrchestratorRequest {
  clientId: string;
  demandType: 'instagram_post' | 'linkedin_post' | 'youtube_video' | 'meta_ads_campaign' | 'carousel' | 'reels' | 'full_campaign';
  topic: string;
  objective?: string;
  additionalContext?: string;
  useFocusGroup?: boolean;
  minFocusGroupScore?: number;
}

export interface OrchestratorResponse {
  success: boolean;
  requestId: string;
  demandType: string;
  crewUsed: string;
  agentsInvolved: string[];
  outputs: {
    strategy?: string;
    copy?: string;
    visualPrompt?: string;
    hashtags?: string[];
    cta?: string;
    schedule?: string;
  };
  focusGroupResult?: FocusGroupResult;
  executionTime: number;
  tokenUsage: number;
}

export interface FocusGroupResult {
  averageScore: number;
  passed: boolean;
  iterations: number;
  evaluations: PersonaEvaluation[];
}

export interface PersonaEvaluation {
  personaId: string;
  personaName: string;
  score: number;
  positives: string[];
  negatives: string[];
  suggestions: string[];
  verdict: 'aprovado' | 'reprovado' | 'precisa_ajustes';
}

export interface BrandContext {
  clientId: string;
  brandName?: string;
  toneOfVoice?: string;
  values?: string[];
  targetAudience?: string;
  visualIdentity?: string;
  rawContext: string;
}
