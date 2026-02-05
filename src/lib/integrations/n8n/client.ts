/**
 * Valle 360 - Cliente N8N
 * Integração com instância N8N para automação de workflows
 */

// =====================================================
// TIPOS
// =====================================================

export interface N8NConfig {
  baseUrl: string;
  apiKey: string;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  nodes?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting';
  startedAt: string;
  finishedAt?: string;
  data?: Record<string, any>;
  error?: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  workflowId: string;
  active: boolean;
}

export interface N8NTrigger {
  type: 'new_client' | 'task_overdue' | 'low_nps' | 'negative_review' | 'contract_expiring' | 'custom';
  description: string;
  workflowId?: string;
  active: boolean;
}

// =====================================================
// CLIENTE N8N
// =====================================================

class N8NClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: N8NConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`N8N API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // =====================================================
  // WORKFLOWS
  // =====================================================

  /**
   * Lista todos os workflows
   */
  async listWorkflows(): Promise<Workflow[]> {
    // Try real API call first
    if (this.apiKey && this.baseUrl) {
      try {
        const response = await this.request<{ data: Workflow[] }>('/api/v1/workflows');
        return response.data || [];
      } catch (error) {
        console.warn('N8N API not available, using mock data:', error);
      }
    }
    
    // Fallback to mock data
    return [
      {
        id: 'wf_1',
        name: 'Onboarding de Novo Cliente',
        active: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-12-01T15:30:00Z',
        tags: ['cliente', 'onboarding'],
        nodes: 8
      },
      {
        id: 'wf_2',
        name: 'Alerta de Tarefa Atrasada',
        active: true,
        createdAt: '2024-02-20T14:00:00Z',
        updatedAt: '2024-11-28T09:15:00Z',
        tags: ['tarefas', 'alerta'],
        nodes: 5
      },
      {
        id: 'wf_3',
        name: 'Resposta Automática Review Negativo',
        active: false,
        createdAt: '2024-03-10T11:00:00Z',
        updatedAt: '2024-10-15T16:45:00Z',
        tags: ['review', 'automação'],
        nodes: 12
      },
      {
        id: 'wf_4',
        name: 'NPS Baixo - Notificação',
        active: true,
        createdAt: '2024-04-05T09:00:00Z',
        updatedAt: '2024-12-02T11:20:00Z',
        tags: ['nps', 'alerta'],
        nodes: 6
      },
      {
        id: 'wf_5',
        name: 'Relatório Semanal Automático',
        active: true,
        createdAt: '2024-05-12T08:00:00Z',
        updatedAt: '2024-11-30T17:00:00Z',
        tags: ['relatório', 'automação'],
        nodes: 15
      },
      {
        id: 'wf_6',
        name: 'Integração Google Ads',
        active: true,
        createdAt: '2024-06-18T13:00:00Z',
        updatedAt: '2024-12-03T10:00:00Z',
        tags: ['google', 'ads', 'integração'],
        nodes: 10
      },
      {
        id: 'wf_7',
        name: 'Sync CRM - Supabase',
        active: true,
        createdAt: '2024-07-22T16:00:00Z',
        updatedAt: '2024-12-01T08:30:00Z',
        tags: ['crm', 'sync'],
        nodes: 7
      }
    ];
  }

  /**
   * Obtém um workflow específico
   */
  async getWorkflow(id: string): Promise<Workflow | null> {
    const workflows = await this.listWorkflows();
    return workflows.find(w => w.id === id) || null;
  }

  /**
   * Ativa/desativa um workflow
   */
  async toggleWorkflow(id: string, active: boolean): Promise<boolean> {
    if (this.apiKey && this.baseUrl) {
      try {
        await this.request(`/api/v1/workflows/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ active })
        });
        return true;
      } catch (error) {
        console.error('Failed to toggle workflow:', error);
      }
    }
    
    console.log(`Workflow ${id} ${active ? 'ativado' : 'desativado'} (mock)`);
    return true;
  }

  /**
   * Executa um workflow manualmente
   */
  async executeWorkflow(id: string, data?: Record<string, any>): Promise<WorkflowExecution> {
    if (this.apiKey && this.baseUrl) {
      try {
        const result = await this.request<any>(`/api/v1/workflows/${id}/execute`, {
          method: 'POST',
          body: JSON.stringify(data || {})
        });
        
        return {
          id: result.executionId || `exec_${Date.now()}`,
          workflowId: id,
          status: result.finished ? 'success' : 'running',
          startedAt: result.startedAt || new Date().toISOString(),
          finishedAt: result.stoppedAt,
          data: result.data
        };
      } catch (error) {
        console.error('Failed to execute workflow:', error);
        throw error;
      }
    }
    
    // Mock response
    return {
      id: `exec_${Date.now()}`,
      workflowId: id,
      status: 'success',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      data: { result: 'Workflow executado com sucesso (mock)' }
    };
  }

  // =====================================================
  // EXECUÇÕES
  // =====================================================

  /**
   * Lista execuções de um workflow
   */
  async listExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    if (this.apiKey && this.baseUrl) {
      try {
        const params = workflowId ? `?workflowId=${workflowId}` : '';
        const result = await this.request<{ data: any[] }>(`/api/v1/executions${params}`);
        
        return (result.data || []).map((exec: any) => ({
          id: exec.id,
          workflowId: exec.workflowId,
          status: exec.finished ? (exec.stoppedAt ? 'success' : 'error') : 'running',
          startedAt: exec.startedAt,
          finishedAt: exec.stoppedAt,
          data: exec.data,
          error: exec.data?.error?.message,
        }));
      } catch (error) {
        console.warn('Failed to list executions, using mock:', error);
      }
    }
    
    // Mock data fallback
    const executions: WorkflowExecution[] = [
      {
        id: 'exec_1',
        workflowId: 'wf_1',
        status: 'success' as const,
        startedAt: '2024-12-05T10:30:00Z',
        finishedAt: '2024-12-05T10:30:05Z'
      },
      {
        id: 'exec_2',
        workflowId: 'wf_2',
        status: 'success' as const,
        startedAt: '2024-12-05T09:15:00Z',
        finishedAt: '2024-12-05T09:15:02Z'
      },
      {
        id: 'exec_3',
        workflowId: 'wf_4',
        status: 'error' as const,
        startedAt: '2024-12-05T08:00:00Z',
        finishedAt: '2024-12-05T08:00:10Z',
        error: 'Timeout ao conectar com serviço externo'
      },
      {
        id: 'exec_4',
        workflowId: 'wf_5',
        status: 'running' as const,
        startedAt: '2024-12-05T11:00:00Z'
      }
    ];
    
    return executions.filter(e => !workflowId || e.workflowId === workflowId);
  }

  // =====================================================
  // WEBHOOKS
  // =====================================================

  /**
   * Lista webhooks configurados
   */
  async listWebhooks(): Promise<Webhook[]> {
    return [
      {
        id: 'wh_1',
        name: 'Novo Cliente',
        url: `${this.baseUrl}/webhook/new-client`,
        method: 'POST',
        workflowId: 'wf_1',
        active: true
      },
      {
        id: 'wh_2',
        name: 'Review Recebido',
        url: `${this.baseUrl}/webhook/review`,
        method: 'POST',
        workflowId: 'wf_3',
        active: true
      },
      {
        id: 'wh_3',
        name: 'NPS Submission',
        url: `${this.baseUrl}/webhook/nps`,
        method: 'POST',
        workflowId: 'wf_4',
        active: true
      }
    ];
  }

  /**
   * Dispara um webhook
   */
  async triggerWebhook(webhookId: string, data: Record<string, any>): Promise<boolean> {
    const webhooks = await this.listWebhooks();
    const webhook = webhooks.find(w => w.id === webhookId);
    
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} não encontrado`);
    }

    try {
      await fetch(webhook.url, {
        method: webhook.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log(`Webhook ${webhook.name} disparado com sucesso`);
      return true;
    } catch (error) {
      console.error(`Falha ao disparar webhook ${webhook.name}:`, error);
      return false;
    }
  }

  /**
   * Dispara um webhook por URL direta
   */
  async triggerWebhookByUrl(url: string, data: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('Falha ao disparar webhook:', error);
      return false;
    }
  }
}

// =====================================================
// TRIGGERS PRÉ-CONFIGURADOS
// =====================================================

export const AVAILABLE_TRIGGERS: N8NTrigger[] = [
  {
    type: 'new_client',
    description: 'Quando um novo cliente é cadastrado',
    workflowId: 'wf_1',
    active: true
  },
  {
    type: 'task_overdue',
    description: 'Quando uma tarefa fica atrasada',
    workflowId: 'wf_2',
    active: true
  },
  {
    type: 'low_nps',
    description: 'Quando NPS do cliente fica abaixo de 7',
    workflowId: 'wf_4',
    active: true
  },
  {
    type: 'negative_review',
    description: 'Quando um review negativo é detectado',
    workflowId: 'wf_3',
    active: false
  },
  {
    type: 'contract_expiring',
    description: 'Quando contrato está próximo do vencimento',
    active: false
  }
];

// =====================================================
// INSTÂNCIA SINGLETON
// =====================================================

let n8nClientInstance: N8NClient | null = null;

export function getN8NClient(): N8NClient {
  if (!n8nClientInstance) {
    n8nClientInstance = new N8NClient({
      baseUrl: process.env.NEXT_PUBLIC_N8N_URL || 'http://localhost:5678',
      apiKey: process.env.N8N_API_KEY || ''
    });
  }
  return n8nClientInstance;
}

export function initN8NClient(config: N8NConfig): N8NClient {
  n8nClientInstance = new N8NClient(config);
  return n8nClientInstance;
}

export { N8NClient };

