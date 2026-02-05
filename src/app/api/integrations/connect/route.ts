import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface ConnectRequest {
  integrationId: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
  config?: Record<string, any>;
}

function normalizeBaseUrl(input: string) {
  return String(input || '').trim().replace(/\/+$/, '');
}

function buildInstagramBackApiUrl(baseUrlRaw: string, path: string) {
  const baseUrl = normalizeBaseUrl(baseUrlRaw);
  const p = path.startsWith('/') ? path : `/${path}`;
  // Aceita baseUrl com ou sem "/api"
  if (baseUrl.endsWith('/api')) return `${baseUrl}${p}`;
  return `${baseUrl}/api${p}`;
}

async function instagramBackLogin(params: { baseUrl: string; email: string; password: string }) {
  const url = buildInstagramBackApiUrl(params.baseUrl, '/auth/login');
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: params.email, password: params.password }),
  });
  const raw = await r.text();
  if (!r.ok) {
    throw new Error(raw || `Falha no login (${r.status})`);
  }
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }
  const token =
    json?.access_token ||
    json?.accessToken ||
    json?.token ||
    json?.data?.access_token ||
    json?.data?.accessToken ||
    json?.data?.token;
  if (!token) {
    throw new Error('Login OK, mas não retornou access_token/token');
  }
  return String(token);
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Somente admin pode configurar integrações
    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }

    const body: ConnectRequest = await request.json();
    const { integrationId, apiKey, apiSecret, accessToken, refreshToken, webhookSecret } = body;
    const config = body.config || {};

    if (!integrationId) {
      return NextResponse.json({ error: 'ID da integração é obrigatório' }, { status: 400 });
    }

    // Validar credenciais baseado no tipo de integração
    const validationResult = await validateCredentials(integrationId, { apiKey, apiSecret, accessToken }, { config });
    
    if (!validationResult.valid) {
      // Registrar log de erro
      await supabase.from('integration_logs').insert({
        integration_id: integrationId,
        action: 'connect',
        status: 'error',
        error_message: validationResult.error,
        request_data: { hasApiKey: !!apiKey, hasAccessToken: !!accessToken }
      });

      return NextResponse.json({ 
        error: validationResult.error,
        details: validationResult.details 
      }, { status: 400 });
    }

    // Resolução de credenciais para integrações específicas
    let resolvedAccessToken = accessToken;
    if (integrationId === 'instagramback') {
      const baseUrl = normalizeBaseUrl(config?.baseUrl);
      if (!baseUrl) {
        return NextResponse.json({ error: 'Base URL é obrigatória (config.baseUrl)' }, { status: 400 });
      }
      config.baseUrl = baseUrl;

      if (!resolvedAccessToken) {
        const email = String(config?.email || '').trim();
        const password = String(config?.password || '').trim();
        if (email && password) {
          try {
            resolvedAccessToken = await instagramBackLogin({ baseUrl, email, password });
          } catch (e: any) {
            return NextResponse.json(
              { error: 'Falha no login do InstagramBack', details: e?.message || String(e) },
              { status: 400 }
            );
          }
        }
      }
    }

    // Atualizar configuração da integração
    const upsertPayload = {
      integration_id: integrationId,
      // Para integrações novas, precisamos preencher metadados obrigatórios no insert.
      ...(integrationId === 'instagramback'
        ? {
            display_name: 'InstagramBack',
            category: 'marketing',
          }
        : integrationId === 'whatsapp'
          ? {
              display_name: 'WhatsApp Business',
              category: 'communication',
            }
          : integrationId === 'perplexity'
            ? {
                display_name: 'Perplexity (Sonar)',
                category: 'ai',
              }
          : {}),
      api_key: apiKey ?? null,
      api_secret: apiSecret ?? null,
      access_token: resolvedAccessToken ?? null,
      refresh_token: refreshToken ?? null,
      webhook_secret: webhookSecret ?? null,
      config: config || {},
      status: 'connected',
      last_sync: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('integration_configs')
      .upsert(upsertPayload, { onConflict: 'integration_id' })
      .select('integration_id, display_name, status, last_sync')
      .single();

    if (error) {
      console.error('Erro ao atualizar integração:', error);
      return NextResponse.json(
        {
          error: 'Erro ao salvar configuração',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Registrar log de sucesso
    await supabase.from('integration_logs').insert({
      integration_id: integrationId,
      action: 'connect',
      status: 'success',
      response_data: { connected: true }
    });

    return NextResponse.json({
      success: true,
      message: `${data.display_name || integrationId} conectado com sucesso`,
      integration: {
        id: data.integration_id,
        name: data.display_name || integrationId,
        status: data.status,
        lastSync: data.last_sync
      }
    });

  } catch (error: any) {
    console.error('Erro na conexão:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// Função para validar credenciais
async function validateCredentials(
  integrationId: string, 
  credentials: { apiKey?: string; apiSecret?: string; accessToken?: string },
  extra?: { config?: Record<string, any> }
): Promise<{ valid: boolean; error?: string; details?: string }> {
  
  const { apiKey, apiSecret, accessToken } = credentials;
  const cfg = extra?.config || {};

  switch (integrationId) {
    case 'perplexity':
      if (!apiKey || apiKey.length < 16) {
        return {
          valid: false,
          error: 'API Key inválida',
          details: 'Informe a API Key do Perplexity (geralmente começa com "pplx-").',
        };
      }
      // Best-effort: não bloquear se rede falhar.
      try {
        const r = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: String(cfg?.model || 'sonar'),
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 8,
            temperature: 0,
          }),
        });
        if (!r.ok) {
          const raw = await r.text().catch(() => '');
          return { valid: false, error: 'API Key inválida ou sem permissão', details: raw.slice(0, 200) };
        }
      } catch {
        // ignore
      }
      break;

    case 'openai':
      if (!apiKey || !apiKey.startsWith('sk-')) {
        return { valid: false, error: 'API Key inválida', details: 'A API Key da OpenAI deve começar com "sk-"' };
      }
      // Testar conexão com OpenAI
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) {
          return { valid: false, error: 'API Key inválida ou sem permissões' };
        }
      } catch {
        return { valid: false, error: 'Não foi possível validar a API Key' };
      }
      break;

    case 'openrouter':
      if (!apiKey || apiKey.length < 10) {
        return { valid: false, error: 'API Key inválida', details: 'Informe a API Key do OpenRouter' };
      }
      // Opcional: validar chamando modelos (não bloquear se falhar por CORS/rede)
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) {
          return { valid: false, error: 'API Key inválida ou sem permissões' };
        }
      } catch {
        // não bloquear validação se rede falhar
      }
      break;

    case 'anthropic':
      if (!apiKey || apiKey.length < 10) {
        return { valid: false, error: 'API Key inválida', details: 'Informe a API Key da Anthropic (Claude)' };
      }
      break;

    case 'gemini':
      if (!apiKey || apiKey.length < 10) {
        return { valid: false, error: 'API Key inválida', details: 'Informe a API Key do Google Gemini/Cloud' };
      }
      break;

    case 'stripe':
      if (!apiKey || (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_'))) {
        return { valid: false, error: 'Secret Key inválida', details: 'A Secret Key do Stripe deve começar com "sk_live_" ou "sk_test_"' };
      }
      // Testar conexão com Stripe
      try {
        const response = await fetch('https://api.stripe.com/v1/balance', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) {
          return { valid: false, error: 'Secret Key inválida ou sem permissões' };
        }
      } catch {
        return { valid: false, error: 'Não foi possível validar a Secret Key' };
      }
      break;

    case 'sendgrid':
      if (!apiKey || !apiKey.startsWith('SG.')) {
        return { valid: false, error: 'API Key inválida', details: 'A API Key do SendGrid deve começar com "SG."' };
      }
      break;

    case 'whatsapp':
      {
        if (!accessToken) {
          return { valid: false, error: 'Access Token é obrigatório' };
        }
        const phoneNumberId = String(cfg?.phoneNumberId || '').trim();
        if (!phoneNumberId) {
          return { valid: false, error: 'Phone Number ID é obrigatório', details: 'Preencha config.phoneNumberId' };
        }

        // Validar token (Graph API) — evita marcar "connected" com credenciais inválidas
        try {
          const rawToken = String(accessToken || '').trim();
          const token = rawToken.toLowerCase().startsWith('bearer ') ? rawToken.slice(7).trim() : rawToken;
          const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}?fields=verified_name`;
          const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!r.ok) {
            const raw = await r.text().catch(() => '');
            return { valid: false, error: 'Token do WhatsApp inválido ou sem permissão', details: raw.slice(0, 200) };
          }
        } catch {
          // Se rede falhar momentaneamente, não bloquear o fluxo.
        }
      }
      break;

    case 'meta_ads':
    case 'instagram':
      if (!accessToken) {
        return { valid: false, error: 'Access Token é obrigatório para Meta/Instagram' };
      }
      break;

    case 'google_ads':
    case 'google_calendar':
    case 'google_meet':
      if (!accessToken) {
        return { valid: false, error: 'Access Token é obrigatório para serviços Google' };
      }
      break;

    case 'slack':
      if (!accessToken) {
        return { valid: false, error: 'Bot Token é obrigatório' };
      }
      break;

    case 'instagramback':
      {
        const baseUrl = String(cfg?.baseUrl || '').trim();
        const email = String(cfg?.email || '').trim();
        const password = String(cfg?.password || '').trim();

        if (!baseUrl) {
          return { valid: false, error: 'Base URL é obrigatória', details: 'Preencha config.baseUrl' };
        }
        // Permite token manual OU login via email/senha
        if (!accessToken && !(email && password)) {
          return {
            valid: false,
            error: 'Informe Access Token ou Email/Senha',
            details: 'Para InstagramBack, você pode colar o token ou informar email/senha para login automático.',
          };
        }
      }
      break;

    default:
      // Para outras integrações, aceitar qualquer credencial
      if (!apiKey && !accessToken) {
        return { valid: false, error: 'API Key ou Access Token é obrigatório' };
      }
  }

  return { valid: true };
}






