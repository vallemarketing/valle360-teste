/**
 * Valle 360 - Tavily Search API Integration
 * Webscraping e pesquisa web em tempo real
 */

const TAVILY_API_URL = 'https://api.tavily.com';

export interface TavilySearchOptions {
  query: string;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  topic?: 'general' | 'news';
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate?: string;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  responseTime: number;
}

export interface TavilyExtractOptions {
  urls: string[];
}

export interface TavilyExtractResult {
  url: string;
  rawContent: string;
  error?: string;
}

// =====================================================
// CLIENTE TAVILY
// =====================================================

class TavilyClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
  }

  private async request<T>(endpoint: string, body: any): Promise<T> {
    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY não configurada');
    }

    const response = await fetch(`${TAVILY_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        ...body
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro Tavily: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Pesquisa web com IA
   */
  async search(options: TavilySearchOptions): Promise<TavilySearchResponse> {
    const startTime = Date.now();

    const result = await this.request<any>('/search', {
      query: options.query,
      search_depth: options.searchDepth || 'basic',
      include_answer: options.includeAnswer ?? true,
      include_raw_content: options.includeRawContent ?? false,
      max_results: options.maxResults || 10,
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains,
      topic: options.topic || 'general'
    });

    return {
      query: options.query,
      answer: result.answer,
      results: result.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        rawContent: r.raw_content,
        score: r.score,
        publishedDate: r.published_date
      })),
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Extrai conteúdo de URLs específicas
   */
  async extract(options: TavilyExtractOptions): Promise<TavilyExtractResult[]> {
    const result = await this.request<any>('/extract', {
      urls: options.urls
    });

    return result.results.map((r: any) => ({
      url: r.url,
      rawContent: r.raw_content,
      error: r.error
    }));
  }

  /**
   * Pesquisa notícias recentes
   */
  async searchNews(query: string, maxResults: number = 10): Promise<TavilySearchResponse> {
    return this.search({
      query,
      topic: 'news',
      searchDepth: 'advanced',
      maxResults,
      includeAnswer: true
    });
  }

  /**
   * Pesquisa informações de empresa
   */
  async searchCompany(companyName: string): Promise<TavilySearchResponse> {
    return this.search({
      query: `${companyName} empresa informações contato site`,
      searchDepth: 'advanced',
      maxResults: 10,
      includeAnswer: true
    });
  }

  /**
   * Pesquisa concorrentes
   */
  async searchCompetitors(
    industry: string, 
    location?: string,
    excludeCompany?: string
  ): Promise<TavilySearchResponse> {
    let query = `principais empresas ${industry}`;
    if (location) query += ` em ${location}`;
    if (excludeCompany) query += ` exceto ${excludeCompany}`;

    return this.search({
      query,
      searchDepth: 'advanced',
      maxResults: 15,
      includeAnswer: true
    });
  }

  /**
   * Pesquisa tendências de mercado
   */
  async searchTrends(industry: string): Promise<TavilySearchResponse> {
    return this.search({
      query: `tendências ${industry} 2024 2025 mercado brasil`,
      topic: 'news',
      searchDepth: 'advanced',
      maxResults: 10,
      includeAnswer: true
    });
  }

  /**
   * Pesquisa redes sociais de empresa
   */
  async searchSocialMedia(companyName: string): Promise<TavilySearchResponse> {
    return this.search({
      query: `${companyName} instagram facebook linkedin twitter site:instagram.com OR site:facebook.com OR site:linkedin.com`,
      searchDepth: 'advanced',
      maxResults: 10,
      includeDomains: ['instagram.com', 'facebook.com', 'linkedin.com', 'twitter.com']
    });
  }

  /**
   * Pesquisa reputação online
   */
  async searchReputation(companyName: string): Promise<TavilySearchResponse> {
    return this.search({
      query: `${companyName} avaliação review reclamação opinião`,
      searchDepth: 'advanced',
      maxResults: 15,
      includeAnswer: true,
      includeDomains: ['reclameaqui.com.br', 'google.com/maps', 'trustpilot.com']
    });
  }
}

// Singleton
export const tavilyClient = new TavilyClient();
export default tavilyClient;

