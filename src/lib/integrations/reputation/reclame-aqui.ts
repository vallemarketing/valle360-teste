/**
 * Valle 360 - Reclame Aqui Integration
 * Integração com Reclame Aqui para monitoramento de reclamações
 */

// =====================================================
// TIPOS
// =====================================================

export interface ReclameAquiComplaint {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'answered' | 'solved' | 'not_solved';
  rating?: number; // 1-10 (nota do consumidor após resolução)
  createdAt: string;
  answeredAt?: string;
  solvedAt?: string;
  author: {
    name: string;
    city?: string;
    state?: string;
  };
  company: {
    response?: string;
    responseDate?: string;
  };
  category?: string;
}

export interface ReclameAquiMetrics {
  totalComplaints: number;
  solvedComplaints: number;
  pendingComplaints: number;
  solutionRate: number; // porcentagem
  averageRating: number; // 0-10
  responseTime: number; // em horas
  reputation: 'otimo' | 'bom' | 'regular' | 'ruim' | 'nao_recomendado';
  reputationScore: number; // 0-10
  wouldBuyAgain: number; // porcentagem
  complaintsLast30Days: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReclameAquiCompanyProfile {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  category: string;
  description?: string;
  isVerified: boolean;
  metrics: ReclameAquiMetrics;
}

// =====================================================
// CLIENTE DA API
// =====================================================

class ReclameAquiClient {
  private companySlug: string | null = null;
  private apiKey: string | null = null;

  /**
   * Configura credenciais de acesso
   */
  setCredentials(companySlug: string, apiKey?: string) {
    this.companySlug = companySlug;
    this.apiKey = apiKey || null;
  }

  /**
   * Busca perfil da empresa no Reclame Aqui
   */
  async getCompanyProfile(): Promise<ReclameAquiCompanyProfile | null> {
    // Em produção, fazer scraping ou usar API parceira
    // Reclame Aqui não tem API pública oficial
    
    // Mock para desenvolvimento
    return {
      id: 'ra_1',
      name: 'Valle 360 Marketing Digital',
      slug: 'valle-360',
      category: 'Marketing e Publicidade',
      isVerified: true,
      metrics: await this.getMetrics()
    };
  }

  /**
   * Busca reclamações recentes
   */
  async getComplaints(page: number = 1, limit: number = 20): Promise<ReclameAquiComplaint[]> {
    // Mock para desenvolvimento
    return [
      {
        id: 'complaint_1',
        title: 'Atraso na entrega do projeto',
        description: 'Contratei a empresa para criar meu site e o prazo foi estendido duas vezes.',
        status: 'solved',
        rating: 8,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        answeredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        solvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        author: {
          name: 'Roberto A.',
          city: 'São Paulo',
          state: 'SP'
        },
        company: {
          response: 'Olá Roberto, pedimos desculpas pelo atraso. Devido a ajustes solicitados, o prazo foi estendido. Ficamos felizes que ficou satisfeito com o resultado final.',
          responseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        category: 'Prazo de Entrega'
      },
      {
        id: 'complaint_2',
        title: 'Problemas com campanha de tráfego pago',
        description: 'A campanha não gerou os resultados prometidos na proposta.',
        status: 'answered',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        answeredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        author: {
          name: 'Carla M.',
          city: 'Rio de Janeiro',
          state: 'RJ'
        },
        company: {
          response: 'Olá Carla, gostaríamos de agendar uma reunião para analisar juntos os dados da campanha e entender os pontos de melhoria.',
          responseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        category: 'Qualidade do Serviço'
      },
      {
        id: 'complaint_3',
        title: 'Falta de comunicação',
        description: 'Demora para responder mensagens e dar retorno sobre o andamento.',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: {
          name: 'Fernando S.',
          city: 'Belo Horizonte',
          state: 'MG'
        },
        company: {},
        category: 'Atendimento'
      }
    ];
  }

  /**
   * Busca métricas consolidadas
   */
  async getMetrics(): Promise<ReclameAquiMetrics> {
    const complaints = await this.getComplaints(1, 100);
    
    const solved = complaints.filter(c => c.status === 'solved').length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const answered = complaints.filter(c => c.status === 'answered').length;
    
    const ratingsSum = complaints
      .filter(c => c.rating)
      .reduce((sum, c) => sum + (c.rating || 0), 0);
    const ratingsCount = complaints.filter(c => c.rating).length;

    const solutionRate = complaints.length > 0 ? (solved / complaints.length) * 100 : 0;
    const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

    // Calcular reputação baseado nos critérios do RA
    let reputation: ReclameAquiMetrics['reputation'] = 'regular';
    let reputationScore = 7.5;
    
    if (solutionRate >= 90 && averageRating >= 8) {
      reputation = 'otimo';
      reputationScore = 9.2;
    } else if (solutionRate >= 70 && averageRating >= 7) {
      reputation = 'bom';
      reputationScore = 7.8;
    } else if (solutionRate >= 50) {
      reputation = 'regular';
      reputationScore = 6.0;
    } else if (solutionRate >= 30) {
      reputation = 'ruim';
      reputationScore = 4.0;
    } else {
      reputation = 'nao_recomendado';
      reputationScore = 2.0;
    }

    return {
      totalComplaints: complaints.length,
      solvedComplaints: solved,
      pendingComplaints: pending,
      solutionRate: Math.round(solutionRate),
      averageRating: Number(averageRating.toFixed(1)),
      responseTime: 24,
      reputation,
      reputationScore,
      wouldBuyAgain: 85,
      complaintsLast30Days: complaints.filter(c => {
        const created = new Date(c.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return created >= thirtyDaysAgo;
      }).length,
      trend: 'up'
    };
  }

  /**
   * Busca reclamações pendentes (não respondidas)
   */
  async getPendingComplaints(): Promise<ReclameAquiComplaint[]> {
    const complaints = await this.getComplaints();
    return complaints.filter(c => c.status === 'pending');
  }

  /**
   * Busca reclamações por categoria
   */
  async getComplaintsByCategory(): Promise<Record<string, number>> {
    const complaints = await this.getComplaints();
    const categories: Record<string, number> = {};
    
    complaints.forEach(c => {
      const cat = c.category || 'Outros';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    return categories;
  }

  /**
   * Calcula score de saúde da reputação
   */
  async calculateHealthScore(): Promise<{
    score: number;
    status: 'excellent' | 'good' | 'attention' | 'critical';
    factors: { name: string; score: number; weight: number }[];
  }> {
    const metrics = await this.getMetrics();
    
    const factors = [
      { name: 'Taxa de Solução', score: metrics.solutionRate, weight: 0.35 },
      { name: 'Nota dos Consumidores', score: metrics.averageRating * 10, weight: 0.30 },
      { name: 'Voltaria a Comprar', score: metrics.wouldBuyAgain, weight: 0.20 },
      { name: 'Tempo de Resposta', score: metrics.responseTime <= 24 ? 100 : Math.max(0, 100 - (metrics.responseTime - 24) * 2), weight: 0.15 }
    ];

    const score = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);

    let status: 'excellent' | 'good' | 'attention' | 'critical' = 'good';
    if (score >= 85) status = 'excellent';
    else if (score >= 70) status = 'good';
    else if (score >= 50) status = 'attention';
    else status = 'critical';

    return { score: Math.round(score), status, factors };
  }
}

// Exportar instância singleton
export const reclameAquiClient = new ReclameAquiClient();
export default reclameAquiClient;

