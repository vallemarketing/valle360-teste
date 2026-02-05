// Meta (Facebook/Instagram) Graph API Client

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface MetaConfig {
  accessToken: string;
  adAccountId?: string;
  businessAccountId?: string;
  pageId?: string;
}

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
}

export class MetaClient {
  private accessToken: string;
  private adAccountId?: string;
  private businessAccountId?: string;

  constructor(config: MetaConfig) {
    this.accessToken = config.accessToken;
    this.adAccountId = config.adAccountId;
    this.businessAccountId = config.businessAccountId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = new URL(`${GRAPH_API_BASE}${endpoint}`);
    url.searchParams.set('access_token', this.accessToken);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return data;
  }

  // Verificar token
  async verifyToken(): Promise<{
    app_id: string;
    user_id: string;
    expires_at: number;
    scopes: string[];
  }> {
    return this.request('/debug_token', {
      method: 'GET'
    });
  }

  // Obter informações do usuário
  async getMe(): Promise<{
    id: string;
    name: string;
    email?: string;
  }> {
    return this.request('/me?fields=id,name,email');
  }

  // ========== INSTAGRAM ==========

  // Obter conta do Instagram Business
  async getInstagramAccount(pageId: string): Promise<{
    instagram_business_account: {
      id: string;
      username: string;
      followers_count: number;
      media_count: number;
    };
  }> {
    return this.request(`/${pageId}?fields=instagram_business_account{id,username,followers_count,media_count}`);
  }

  // Obter métricas do Instagram
  async getInstagramInsights(
    instagramAccountId: string,
    metrics: string[] = ['impressions', 'reach', 'profile_views'],
    period: 'day' | 'week' | 'days_28' = 'day'
  ): Promise<{
    data: Array<{
      name: string;
      period: string;
      values: Array<{ value: number; end_time: string }>;
    }>;
  }> {
    const metricsStr = metrics.join(',');
    return this.request(`/${instagramAccountId}/insights?metric=${metricsStr}&period=${period}`);
  }

  // Obter posts do Instagram
  async getInstagramMedia(
    instagramAccountId: string,
    limit: number = 25
  ): Promise<{
    data: Array<{
      id: string;
      caption?: string;
      media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
      media_url: string;
      thumbnail_url?: string;
      timestamp: string;
      like_count: number;
      comments_count: number;
    }>;
  }> {
    return this.request(
      `/${instagramAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=${limit}`
    );
  }

  // Publicar no Instagram
  async createInstagramPost(
    instagramAccountId: string,
    imageUrl: string,
    caption: string
  ): Promise<{ id: string }> {
    // Primeiro, criar o container
    const container = await this.request<{ id: string }>(`/${instagramAccountId}/media`, {
      method: 'POST',
      body: JSON.stringify({
        image_url: imageUrl,
        caption
      })
    });

    // Depois, publicar
    return this.request(`/${instagramAccountId}/media_publish`, {
      method: 'POST',
      body: JSON.stringify({
        creation_id: container.id
      })
    });
  }

  async createInstagramVideoPost(instagramAccountId: string, videoUrl: string, caption: string): Promise<{ id: string }> {
    const container = await this.request<{ id: string }>(`/${instagramAccountId}/media`, {
      method: 'POST',
      body: JSON.stringify({
        video_url: videoUrl,
        media_type: 'VIDEO',
        caption,
      }),
    });

    return this.request(`/${instagramAccountId}/media_publish`, {
      method: 'POST',
      body: JSON.stringify({ creation_id: container.id }),
    });
  }

  async createInstagramCarouselPost(
    instagramAccountId: string,
    items: Array<{ type: 'image' | 'video'; url: string }>,
    caption: string
  ): Promise<{ id: string }> {
    const childIds: string[] = [];

    for (const item of items.slice(0, 10)) {
      const container = await this.request<{ id: string }>(`/${instagramAccountId}/media`, {
        method: 'POST',
        body: JSON.stringify(
          item.type === 'video'
            ? { video_url: item.url, media_type: 'VIDEO', is_carousel_item: true }
            : { image_url: item.url, is_carousel_item: true }
        ),
      });
      childIds.push(container.id);
    }

    const carouselContainer = await this.request<{ id: string }>(`/${instagramAccountId}/media`, {
      method: 'POST',
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        caption,
        children: childIds.join(','),
      }),
    });

    return this.request(`/${instagramAccountId}/media_publish`, {
      method: 'POST',
      body: JSON.stringify({ creation_id: carouselContainer.id }),
    });
  }

  // ========== FACEBOOK ADS ==========

  // Obter campanhas
  async getAdCampaigns(fields: string[] = ['id', 'name', 'status', 'objective']): Promise<{
    data: Array<{
      id: string;
      name: string;
      status: string;
      objective: string;
    }>;
  }> {
    if (!this.adAccountId) throw new Error('Ad Account ID não configurado');
    const fieldsStr = fields.join(',');
    return this.request(`/${this.adAccountId}/campaigns?fields=${fieldsStr}`);
  }

  // Obter insights de campanha
  async getCampaignInsights(
    campaignId: string,
    datePreset: 'today' | 'yesterday' | 'this_month' | 'last_30d' = 'last_30d'
  ): Promise<{
    data: Array<{
      impressions: string;
      clicks: string;
      spend: string;
      reach: string;
      cpc: string;
      cpm: string;
      ctr: string;
      conversions?: string;
    }>;
  }> {
    return this.request(
      `/${campaignId}/insights?fields=impressions,clicks,spend,reach,cpc,cpm,ctr,conversions&date_preset=${datePreset}`
    );
  }

  // Obter insights da conta de anúncios
  async getAdAccountInsights(
    datePreset: 'today' | 'yesterday' | 'this_month' | 'last_30d' = 'last_30d'
  ): Promise<{
    data: Array<{
      impressions: string;
      clicks: string;
      spend: string;
      reach: string;
      actions?: Array<{ action_type: string; value: string }>;
    }>;
  }> {
    if (!this.adAccountId) throw new Error('Ad Account ID não configurado');
    return this.request(
      `/${this.adAccountId}/insights?fields=impressions,clicks,spend,reach,actions&date_preset=${datePreset}`
    );
  }

  // ========== FACEBOOK PAGE ==========

  // Obter páginas do usuário
  async getPages(): Promise<{
    data: Array<{
      id: string;
      name: string;
      access_token: string;
      category: string;
    }>;
  }> {
    return this.request('/me/accounts');
  }

  // Publicar na página
  async createPagePost(
    pageId: string,
    pageAccessToken: string,
    message: string,
    link?: string
  ): Promise<{ id: string }> {
    const body: any = { message };
    if (link) body.link = link;

    const url = new URL(`${GRAPH_API_BASE}/${pageId}/feed`);
    url.searchParams.set('access_token', pageAccessToken);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    return response.json();
  }

  async createPagePhotoPost(
    pageId: string,
    pageAccessToken: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ id: string }> {
    const url = new URL(`${GRAPH_API_BASE}/${pageId}/photos`);
    url.searchParams.set('access_token', pageAccessToken);

    const body = new URLSearchParams();
    body.set('url', imageUrl);
    if (caption) body.set('caption', caption);
    body.set('published', 'true');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return response.json();
  }

  async createPageVideoPost(
    pageId: string,
    pageAccessToken: string,
    videoUrl: string,
    description?: string
  ): Promise<{ id: string }> {
    const url = new URL(`${GRAPH_API_BASE}/${pageId}/videos`);
    url.searchParams.set('access_token', pageAccessToken);

    const body = new URLSearchParams();
    body.set('file_url', videoUrl);
    if (description) body.set('description', description);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return response.json();
  }

  // Obter métricas da página
  async getPageInsights(
    pageId: string,
    pageAccessToken: string,
    metrics: string[] = ['page_impressions', 'page_engaged_users', 'page_fans'],
    period: 'day' | 'week' | 'days_28' = 'day'
  ): Promise<{
    data: Array<{
      name: string;
      period: string;
      values: Array<{ value: number; end_time: string }>;
    }>;
  }> {
    const metricsStr = metrics.join(',');
    const url = new URL(`${GRAPH_API_BASE}/${pageId}/insights`);
    url.searchParams.set('access_token', pageAccessToken);
    url.searchParams.set('metric', metricsStr);
    url.searchParams.set('period', period);

    const response = await fetch(url.toString());
    return response.json();
  }
}

// Função helper para criar cliente
export function createMetaClient(config: MetaConfig): MetaClient {
  return new MetaClient(config);
}

// Testar conexão
export async function testMetaConnection(accessToken: string): Promise<boolean> {
  try {
    const client = new MetaClient({ accessToken });
    await client.getMe();
    return true;
  } catch {
    return false;
  }
}






