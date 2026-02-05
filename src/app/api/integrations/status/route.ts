import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Somente admin deve ver/configurar status de integrações (evita vazar metadados)
    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('id');
    const category = searchParams.get('category');

    let query = supabase
      .from('integration_configs')
      .select('integration_id, display_name, category, status, last_sync, error_message, config');

    if (integrationId) {
      query = query.eq('integration_id', integrationId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('display_name');

    if (error) {
      console.error('Erro ao buscar integrações:', error);
      return NextResponse.json({ error: 'Erro ao buscar integrações' }, { status: 500 });
    }

    // Formatar resposta
    const envConnectedById: Record<string, boolean> = {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY),
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      sendgrid: true,
      whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN,
    };

    const integrations = data.map((integration) => {
      const envConnected = !!envConnectedById[integration.integration_id];
      const dbConnected = integration.status === 'connected';
      return {
        id: integration.integration_id,
        name: integration.display_name,
        category: integration.category,
        status: integration.status,
        connected: dbConnected || envConnected,
        connectedVia: dbConnected ? 'db' : envConnected ? 'env' : 'none',
        lastSync: integration.last_sync,
        error: integration.error_message,
        config: integration.config,
      };
    });

    // Estatísticas
    const stats = {
      total: integrations.length,
      connected: integrations.filter(i => i.connected).length,
      disconnected: integrations.filter(i => !i.connected).length,
      error: integrations.filter(i => i.status === 'error').length
    };

    return NextResponse.json({
      success: true,
      integrations,
      stats
    });

  } catch (error: any) {
    console.error('Erro ao buscar status:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// Endpoint para verificar saúde de uma integração específica
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }

    const { integrationId } = await request.json();

    if (!integrationId) {
      return NextResponse.json({ error: 'ID da integração é obrigatório' }, { status: 400 });
    }

    // Buscar configuração (pode não existir no banco; nesse caso, permitimos fallback via env vars)
    const { data: dbConfig, error: dbError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_id', integrationId)
      .single();

    const config = !dbError ? dbConfig : null;

    const envConnectedById: Record<string, boolean> = {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY),
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      sendgrid: true,
      whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN,
    };

    const envConnected = !!envConnectedById[integrationId];
    const dbConnected = config?.status === 'connected';

    if (!dbConnected && !envConnected) {
      return NextResponse.json({
        success: true,
        healthy: false,
        reason: config ? 'Integração não está conectada' : 'Integração não configurada (db/env)',
      });
    }

    // Verificar saúde baseado no tipo
    const healthCheck = await checkIntegrationHealth(integrationId, config || {});

    // Atualizar status se necessário
    if (!healthCheck.healthy && config?.status === 'connected') {
      await supabase
        .from('integration_configs')
        .update({
          status: 'error',
          error_message: healthCheck.error
        })
        .eq('integration_id', integrationId);
    }

    // Registrar log
    // (best-effort) só loga quando existe config no banco (evita FK quebrar em ambientes sem seed)
    if (config) {
      await supabase.from('integration_logs').insert({
        integration_id: integrationId,
        action: 'health_check',
        status: healthCheck.healthy ? 'success' : 'error',
        error_message: healthCheck.error,
        duration_ms: healthCheck.responseTime,
        response_data: { connectedVia: dbConnected ? 'db' : envConnected ? 'env' : 'none' },
      });
    }

    return NextResponse.json({
      success: true,
      ...healthCheck
    });

  } catch (error: any) {
    console.error('Erro no health check:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// Função para verificar saúde de cada integração
async function checkIntegrationHealth(
  integrationId: string, 
  config: any
): Promise<{ healthy: boolean; error?: string; responseTime?: number }> {
  const startTime = Date.now();

  try {
    switch (integrationId) {
      case 'perplexity':
        {
          const key = config.api_key || process.env.PERPLEXITY_API_KEY;
          const model = String(config?.config?.model || 'sonar').trim() || 'sonar';
          if (!key) return { healthy: false, error: 'API Key não configurada (db/env)', responseTime: Date.now() - startTime };

          const r = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 8,
              temperature: 0,
            }),
          });
          const raw = await r.text().catch(() => '');
          return {
            healthy: r.ok,
            error: r.ok ? undefined : raw.slice(0, 200) || 'Falha na autenticação',
            responseTime: Date.now() - startTime,
          };
        }

      case 'whatsapp':
        {
          const rawToken = String(config?.access_token || process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
          const token = rawToken.toLowerCase().startsWith('bearer ') ? rawToken.slice(7).trim() : rawToken;
          const phoneNumberId = String(
            config?.config?.phoneNumberId ||
              process.env.WHATSAPP_PHONE_NUMBER_ID ||
              ''
          ).trim();

          if (!token) {
            return { healthy: false, error: 'Access Token não configurado (db/env)', responseTime: Date.now() - startTime };
          }
          if (!phoneNumberId) {
            return { healthy: false, error: 'Phone Number ID não configurado (config.phoneNumberId ou WHATSAPP_PHONE_NUMBER_ID)', responseTime: Date.now() - startTime };
          }

          const apiUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}?fields=verified_name,display_phone_number`;
          const r = await fetch(apiUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const raw = await r.text();
          return {
            healthy: r.ok,
            error: r.ok ? undefined : raw.slice(0, 200) || 'Falha na autenticação/Graph API',
            responseTime: Date.now() - startTime,
          };
        }

      case 'instagramback':
        {
          const baseUrlRaw = config?.config?.baseUrl;
          const accessToken = config?.access_token;
          const baseUrl = String(baseUrlRaw || '').trim().replace(/\/+$/, '');
          if (!baseUrl) {
            return { healthy: false, error: 'Base URL não configurada (config.baseUrl)', responseTime: Date.now() - startTime };
          }
          if (!accessToken) {
            return { healthy: false, error: 'Access Token não configurado', responseTime: Date.now() - startTime };
          }
          const apiUrl = baseUrl.endsWith('/api') ? `${baseUrl}/auth/me` : `${baseUrl}/api/auth/me`;
          const r = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          const raw = await r.text();
          return {
            healthy: r.ok,
            error: r.ok ? undefined : raw.slice(0, 200) || 'Falha na autenticação',
            responseTime: Date.now() - startTime,
          };
        }

      case 'openrouter':
        {
          const key = config.api_key || process.env.OPENROUTER_API_KEY;
          if (!key) return { healthy: false, error: 'API Key não configurada (db/env)' };
          try {
            // Validar o caminho real usado pela app (chat/completions), não apenas /models.
            const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost',
                'X-Title': 'Valle 360',
              },
              body: JSON.stringify({
                model: 'openrouter/auto',
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 8,
                temperature: 0,
              }),
            });
            const raw = await r.text();
            return {
              healthy: r.ok,
              error: r.ok ? undefined : raw.slice(0, 200) || 'Falha na autenticação',
              responseTime: Date.now() - startTime,
            };
          } catch (e: any) {
            return { healthy: false, error: e?.message || 'Falha no health check', responseTime: Date.now() - startTime };
          }
        }

      case 'anthropic':
        // Anthropic não tem endpoint simples de models público; validar apenas presença da key.
        return {
          healthy: !!(config.api_key || process.env.ANTHROPIC_API_KEY),
          error: config.api_key || process.env.ANTHROPIC_API_KEY ? undefined : 'API Key não configurada (db/env)',
          responseTime: Date.now() - startTime,
        };

      case 'gemini':
        // Validar apenas presença da key para evitar custos/chamadas.
        return {
          healthy: !!(config.api_key || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY),
          error:
            config.api_key || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY
              ? undefined
              : 'API Key não configurada (db/env)',
          responseTime: Date.now() - startTime,
        };

      case 'openai':
        if (!(config.api_key || process.env.OPENAI_API_KEY)) return { healthy: false, error: 'API Key não configurada (db/env)' };
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${config.api_key || process.env.OPENAI_API_KEY}` }
        });
        return { 
          healthy: openaiResponse.ok, 
          error: openaiResponse.ok ? undefined : 'Falha na autenticação',
          responseTime: Date.now() - startTime
        };

      case 'stripe':
        if (!(config.api_key || process.env.STRIPE_SECRET_KEY)) return { healthy: false, error: 'Secret Key não configurada (db/env)' };
        const stripeResponse = await fetch('https://api.stripe.com/v1/balance', {
          headers: { 'Authorization': `Bearer ${config.api_key || process.env.STRIPE_SECRET_KEY}` }
        });
        return { 
          healthy: stripeResponse.ok,
          error: stripeResponse.ok ? undefined : 'Falha na autenticação',
          responseTime: Date.now() - startTime
        };

      case 'sendgrid':
        return { healthy: true, responseTime: Date.now() - startTime };

      default:
        // Para outras integrações, verificar se tem credenciais
        const hasCredentials = config.api_key || config.access_token;
        return { 
          healthy: hasCredentials,
          error: hasCredentials ? undefined : 'Credenciais não configuradas',
          responseTime: Date.now() - startTime
        };
    }
  } catch (error: any) {
    return { 
      healthy: false, 
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}






