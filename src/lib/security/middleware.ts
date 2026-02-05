// API Security Middleware - Valle 360
// Middleware de segurança para API routes

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit, RateLimitType } from './rateLimit';
import { audit } from './auditLog';
import { validate, validationErrorResponse } from './validation';
import { z } from 'zod';

interface MiddlewareConfig {
  rateLimit?: RateLimitType;
  requireAuth?: boolean;
  requiredRoles?: string[];
  validateBody?: z.ZodSchema;
  validateQuery?: z.ZodSchema;
  logAction?: string;
}

interface RequestContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  body?: unknown;
  query?: Record<string, string>;
}

type HandlerFunction = (
  request: NextRequest,
  context: RequestContext
) => Promise<Response>;

/**
 * Wrapper de segurança para API routes
 */
export function withSecurity(config: MiddlewareConfig, handler: HandlerFunction) {
  return async (request: NextRequest): Promise<Response> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const context: RequestContext = {};

    try {
      // 1. Rate Limiting
      if (config.rateLimit) {
        const rateLimitResult = await withRateLimit(request, config.rateLimit);
        
        if (!rateLimitResult.allowed) {
          audit.rateLimitExceeded(
            getClientIP(request),
            request.url,
            getClientIP(request)
          );
          return rateLimitResult.response!;
        }
      }

      // 2. Autenticação
      if (config.requireAuth) {
        const authResult = await checkAuth(request);
        
        if (!authResult.authenticated) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized', message: 'Autenticação necessária' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        context.user = authResult.user;

        // 3. Autorização (roles)
        if (config.requiredRoles && config.requiredRoles.length > 0) {
          if (!context.user || !config.requiredRoles.includes(context.user.role)) {
            audit.permissionDenied(
              context.user?.id || 'unknown',
              request.url,
              request.method
            );
            return new Response(
              JSON.stringify({ error: 'Forbidden', message: 'Permissão negada' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      // 4. Validação do body
      if (config.validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          const validation = validate(config.validateBody, body);
          
          if (!validation.success) {
            return validationErrorResponse(validation.errors!);
          }
          
          context.body = validation.data;
        } catch {
          return new Response(
            JSON.stringify({ error: 'Bad Request', message: 'Body inválido' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // 5. Validação da query
      if (config.validateQuery) {
        const url = new URL(request.url);
        const queryParams: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        
        const validation = validate(config.validateQuery, queryParams);
        
        if (!validation.success) {
          return validationErrorResponse(validation.errors!);
        }
        
        context.query = validation.data as Record<string, string>;
      }

      // 6. Executar handler
      const response = await handler(request, context);

      // 7. Log de sucesso (opcional)
      if (config.logAction) {
        const duration = Date.now() - startTime;
        // Log assíncrono para não atrasar resposta
        setImmediate(() => {
          audit.created(
            context.user?.id || 'system',
            'api',
            requestId,
            config.logAction!,
            { duration, method: request.method, url: request.url }
          );
        });
      }

      // Adicionar headers de segurança
      const headers = new Headers(response.headers);
      headers.set('X-Request-ID', requestId);
      headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log do erro
      audit.error(error as Error, {
        requestId,
        url: request.url,
        method: request.method,
        userId: context.user?.id,
        duration
      });

      console.error(`[API Error] ${request.method} ${request.url}:`, error);

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' 
            ? (error as Error).message 
            : 'Erro interno do servidor',
          requestId
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          } 
        }
      );
    }
  };
}

/**
 * Verificar autenticação
 */
async function checkAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: { id: string; email: string; role: string };
}> {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;
  const cookieToken = request.cookies.get('sb-access-token')?.value || null;
  const token = bearer || cookieToken;

  if (!token) return { authenticated: false };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    // Sem config, não “libera” por default.
    return { authenticated: false };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.id || !user.email) return { authenticated: false };

  // Descobrir role via tabelas (sem promoção por fallback)
  let role: string | null = null;

  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('role, user_type')
    .eq('user_id', user.id)
    .maybeSingle();

  role = (profileData?.user_type || profileData?.role || null) as string | null;

  if (!role) {
    const { data: usersData } = await supabase
      .from('users')
      .select('role, user_type')
      .eq('id', user.id)
      .maybeSingle();
    role = (usersData?.user_type || usersData?.role || null) as string | null;
  }

  if (role === 'employee') role = 'colaborador';
  if (!role) role = (user.user_metadata?.role as string | undefined) || 'cliente';

  return { authenticated: true, user: { id: user.id, email: user.email, role } };
}

/**
 * Obter IP do cliente
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Gerar ID único para request
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Headers de segurança padrão
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
};

/**
 * Middleware para adicionar headers de segurança
 */
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  for (const [key, value] of Object.entries(securityHeaders)) {
    headers.set(key, value);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * CORS headers
 */
export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  return {
    'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Handler para OPTIONS (CORS preflight)
 */
export function handleOptions(request: NextRequest): Response {
  const origin = request.headers.get('origin') || undefined;
  
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}

export default {
  withSecurity,
  addSecurityHeaders,
  corsHeaders,
  handleOptions,
  securityHeaders
};









