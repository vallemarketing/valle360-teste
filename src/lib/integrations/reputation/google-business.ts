/**
 * Valle 360 - Google Business Profile Integration
 * Integração com Google My Business para reviews e insights
 */

// =====================================================
// TIPOS
// =====================================================

export interface GoogleBusinessReview {
  id: string;
  authorName: string;
  authorPhoto?: string;
  rating: number; // 1-5
  text: string;
  createTime: string;
  updateTime: string;
  reply?: {
    text: string;
    updateTime: string;
  };
}

export interface GoogleBusinessMetrics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
  responseRate: number;
  averageResponseTime: number; // em horas
}

export interface GoogleBusinessInsight {
  metric: string;
  value: number;
  change: number;
  period: string;
}

export interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  category?: string;
  isVerified: boolean;
}

// =====================================================
// CLIENTE DA API
// =====================================================

class GoogleBusinessClient {
  private accessToken: string | null = null;
  private accountId: string | null = null;

  /**
   * Configura credenciais de acesso
   */
  setCredentials(accessToken: string, accountId: string) {
    this.accessToken = accessToken;
    this.accountId = accountId;
  }

  /**
   * Busca locais/estabelecimentos do negócio
   */
  async getLocations(): Promise<GoogleBusinessLocation[]> {
    // Em produção, chamar Google My Business API
    // GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations
    
    // Mock para desenvolvimento
    return [
      {
        id: 'loc_1',
        name: 'Valle 360 - Matriz',
        address: 'Av. Paulista, 1000 - São Paulo, SP',
        phone: '(11) 99999-0000',
        website: 'https://valle360.com.br',
        category: 'Agência de Marketing Digital',
        isVerified: true
      }
    ];
  }

  /**
   * Busca reviews de um local
   */
  async getReviews(locationId: string, pageSize: number = 50): Promise<GoogleBusinessReview[]> {
    // Em produção, chamar Google My Business API
    // GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
    
    // Mock para desenvolvimento
    return [
      {
        id: 'review_1',
        authorName: 'João Silva',
        rating: 5,
        text: 'Excelente atendimento! A equipe é muito profissional e os resultados foram acima do esperado.',
        createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reply: {
          text: 'Obrigado pelo feedback, João! Ficamos felizes em ajudar. Conte sempre conosco!',
          updateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: 'review_2',
        authorName: 'Maria Santos',
        rating: 4,
        text: 'Muito bom o trabalho, só achei o prazo um pouco longo para algumas entregas.',
        createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'review_3',
        authorName: 'Pedro Costa',
        rating: 5,
        text: 'Profissionais incríveis! Minha empresa cresceu 200% depois que comecei a trabalhar com eles.',
        createTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updateTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'review_4',
        authorName: 'Ana Oliveira',
        rating: 3,
        text: 'O serviço é bom, mas a comunicação poderia melhorar.',
        createTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'review_5',
        authorName: 'Carlos Ferreira',
        rating: 5,
        text: 'Recomendo demais! Atendimento personalizado e resultados reais.',
        createTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updateTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        reply: {
          text: 'Muito obrigado, Carlos! Sucesso sempre!',
          updateTime: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    ];
  }

  /**
   * Responde a um review
   */
  async replyToReview(locationId: string, reviewId: string, text: string): Promise<boolean> {
    // Em produção, chamar Google My Business API
    // PUT https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply
    
    console.log(`Respondendo review ${reviewId}:`, text);
    return true;
  }

  /**
   * Calcula métricas a partir dos reviews
   */
  async getMetrics(locationId: string): Promise<GoogleBusinessMetrics> {
    const reviews = await this.getReviews(locationId);
    
    const ratingDistribution = {
      one: 0,
      two: 0,
      three: 0,
      four: 0,
      five: 0
    };

    let totalRating = 0;
    let reviewsWithReply = 0;

    reviews.forEach(review => {
      totalRating += review.rating;
      
      if (review.rating === 1) ratingDistribution.one++;
      else if (review.rating === 2) ratingDistribution.two++;
      else if (review.rating === 3) ratingDistribution.three++;
      else if (review.rating === 4) ratingDistribution.four++;
      else if (review.rating === 5) ratingDistribution.five++;

      if (review.reply) reviewsWithReply++;
    });

    return {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      ratingDistribution,
      responseRate: reviews.length > 0 ? (reviewsWithReply / reviews.length) * 100 : 0,
      averageResponseTime: 24 // Simulado
    };
  }

  /**
   * Busca insights de performance
   */
  async getInsights(locationId: string): Promise<GoogleBusinessInsight[]> {
    // Em produção, chamar Google My Business API
    // GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/insights
    
    return [
      { metric: 'Visualizações do perfil', value: 1250, change: 15, period: 'últimos 30 dias' },
      { metric: 'Cliques no site', value: 89, change: 8, period: 'últimos 30 dias' },
      { metric: 'Ligações', value: 34, change: -5, period: 'últimos 30 dias' },
      { metric: 'Solicitações de rota', value: 56, change: 12, period: 'últimos 30 dias' },
      { metric: 'Buscas diretas', value: 780, change: 20, period: 'últimos 30 dias' },
      { metric: 'Buscas indiretas', value: 470, change: 10, period: 'últimos 30 dias' }
    ];
  }

  /**
   * Busca reviews não respondidos
   */
  async getUnrepliedReviews(locationId: string): Promise<GoogleBusinessReview[]> {
    const reviews = await this.getReviews(locationId);
    return reviews.filter(r => !r.reply);
  }

  /**
   * Busca reviews negativos (1-3 estrelas)
   */
  async getNegativeReviews(locationId: string): Promise<GoogleBusinessReview[]> {
    const reviews = await this.getReviews(locationId);
    return reviews.filter(r => r.rating <= 3);
  }
}

// Exportar instância singleton
export const googleBusinessClient = new GoogleBusinessClient();
export default googleBusinessClient;

