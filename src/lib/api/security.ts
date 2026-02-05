/**
 * Valle 360 - API Security Module
 * Implementação completa de segurança para API
 * 
 * Inclui:
 * - Rate Limiting (por IP e API Key)
 * - Validação de API Keys
 * - Sanitização de inputs
 * - Proteção CSRF
 * - Headers de segurança
 * - Logging de auditoria
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// =====================================================
// TIPOS
// =====================================================

export interface RateLimitConfig {
  windowMs: number;      // Janela de tempo em ms
  maxRequests: number;   // Máximo de requisições na janela
  keyPrefix?: string;    // Prefixo para a chave no cache
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string[];
  clientId: string;
  userId: string;
  expiresAt: Date | null;
  rateLimit: number;
}

export interface SecurityConfig {
  enableRateLimit: boolean;
  enableCsrfProtection: boolean;
  enableInputSanitization: boolean;
  enableSecurityHeaders: boolean;
  enableAuditLog: boolean;
  allowedOrigins: string[];
  trustedProxies: string[];
}

export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  userId?: string;
  clientId?: string;
  apiKeyId?: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  details?: Record<string, unknown>;
}

// =====================================================
// CONFIGURAÇÃO PADRÃO
// =====================================================

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableRateLimit: true,
  enableCsrfProtection: true,
  enableInputSanitization: true,
  enableSecurityHeaders: true,
  enableAuditLog: true,
  allowedOrigins: [
    'https://valle360.com',
    'https://app.valle360.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  trustedProxies: ['127.0.0.1', '::1']
};

// Rate limit configs por tipo de plano
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  basic: {
    windowMs: 60 * 1000,   // 1 minuto
    maxRequests: 100
  },
  premium: {
    windowMs: 60 * 1000,
    maxRequests: 500
  },
  enterprise: {
    windowMs: 60 * 1000,
    maxRequests: 1000
  },
  default: {
    windowMs: 60 * 1000,
    maxRequests: 60
  }
};

// =====================================================
// RATE LIMITER (em memória para desenvolvimento)
// Em produção, usar Redis
// =====================================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Se não existe ou expirou, criar novo
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs
    };
  }

  // Se existe e não expirou
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    };
  }

  // Incrementar contador
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt
  };
}

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // A cada minuto

// =====================================================
// VALIDAÇÃO DE API KEY
// =====================================================

export async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; info?: ApiKeyInfo; error?: string }> {
  // API Keys devem começar com prefixo específico
  if (!apiKey.startsWith('valle_sk_')) {
    return { valid: false, error: 'invalid_key_format' };
  }

  try {
    // Criar cliente Supabase admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar API key no banco
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hashApiKey(apiKey))
      .eq('is_active', true)
      .single();

    if (error || !keyData) {
      return { valid: false, error: 'invalid_key' };
    }

    // Verificar expiração
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false, error: 'key_expired' };
    }

    // Atualizar último uso
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    return {
      valid: true,
      info: {
        id: keyData.id,
        name: keyData.name,
        scopes: keyData.scopes || [],
        clientId: keyData.client_id,
        userId: keyData.user_id,
        expiresAt: keyData.expires_at ? new Date(keyData.expires_at) : null,
        rateLimit: keyData.rate_limit || RATE_LIMIT_CONFIGS.default.maxRequests
      }
    };
  } catch {
    return { valid: false, error: 'validation_error' };
  }
}

// Hash da API key para armazenamento seguro
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Gerar nova API key
export function generateApiKey(): { key: string; hash: string } {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `valle_sk_live_${randomBytes}`;
  const hash = hashApiKey(key);
  return { key, hash };
}

// =====================================================
// SANITIZAÇÃO DE INPUTS
// =====================================================

export function sanitizeInput(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitizar também as chaves
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

export function sanitizeString(str: string): string {
  return str
    // Remover tags HTML
    .replace(/<[^>]*>/g, '')
    // Escapar caracteres especiais HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remover caracteres de controle
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Limitar tamanho
    .substring(0, 10000)
    .trim();
}

// Sanitização específica para SQL (adicional ao Supabase que já faz isso)
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

// =====================================================
// PROTEÇÃO CSRF
// =====================================================

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  
  // Comparação segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}

// =====================================================
// HEADERS DE SEGURANÇA
// =====================================================

export function getSecurityHeaders(): Record<string, string> {
  return {
    // Previne clickjacking
    'X-Frame-Options': 'DENY',
    
    // Previne sniffing de MIME type
    'X-Content-Type-Options': 'nosniff',
    
    // Habilita filtro XSS do browser
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy (antes Feature-Policy)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    
    // HSTS (apenas em produção)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Cache control para dados sensíveis
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

// =====================================================
// CORS
// =====================================================

export function getCorsHeaders(
  origin: string | null,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 horas
    'Access-Control-Allow-Credentials': 'true'
  };

  // Verificar se a origem é permitida
  if (origin && config.allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (config.allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

// =====================================================
// LOGGING DE AUDITORIA
// =====================================================

const auditLogBuffer: AuditLogEntry[] = [];
const AUDIT_LOG_FLUSH_INTERVAL = 10000; // 10 segundos
const AUDIT_LOG_BATCH_SIZE = 100;

export function logAuditEntry(entry: AuditLogEntry): void {
  auditLogBuffer.push(entry);

  // Flush se buffer estiver cheio
  if (auditLogBuffer.length >= AUDIT_LOG_BATCH_SIZE) {
    flushAuditLog();
  }
}

async function flushAuditLog(): Promise<void> {
  if (auditLogBuffer.length === 0) return;

  const entries = auditLogBuffer.splice(0, AUDIT_LOG_BATCH_SIZE);

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('audit_logs').insert(
      entries.map((e) => ({
        user_id: e.userId || null,
        action: `api.${e.action}`,
        entity_type: 'api',
        entity_id: null,
        old_values: null,
        new_values: {
          severity: e.statusCode >= 500 ? 'error' : e.statusCode >= 400 ? 'warning' : 'info',
          success: e.statusCode < 400,
          description: `${e.method} ${e.endpoint} (${e.statusCode})`,
          metadata: {
            client_id: e.clientId || null,
            api_key_id: e.apiKeyId || null,
            endpoint: e.endpoint,
            method: e.method,
            status_code: e.statusCode,
            response_time_ms: e.responseTime,
            details: e.details || null,
          },
        },
        ip_address: e.ip || null,
        user_agent: e.userAgent || null,
        created_at: e.timestamp.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Failed to flush audit log:', error);
    // Recolocar entries no buffer para tentar novamente
    auditLogBuffer.unshift(...entries);
  }
}

// Flush periódico
setInterval(flushAuditLog, AUDIT_LOG_FLUSH_INTERVAL);

// =====================================================
// MIDDLEWARE PRINCIPAL
// =====================================================

export interface ApiSecurityResult {
  allowed: boolean;
  response?: NextResponse;
  apiKeyInfo?: ApiKeyInfo;
  rateLimitInfo?: {
    remaining: number;
    resetAt: number;
  };
}

export async function apiSecurityMiddleware(
  request: NextRequest,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): Promise<ApiSecurityResult> {
  const startTime = Date.now();
  const ip = getClientIp(request, config.trustedProxies);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const origin = request.headers.get('origin');

  // 1. Verificar CORS para OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin, config);
    return {
      allowed: true,
      response: new NextResponse(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          ...getSecurityHeaders()
        }
      })
    };
  }

  // 2. Validar API Key (se presente)
  let apiKeyInfo: ApiKeyInfo | undefined;
  const authHeader = request.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer valle_sk_')) {
    const apiKey = authHeader.replace('Bearer ', '');
    const validation = await validateApiKey(apiKey);
    
    if (!validation.valid) {
      logAuditEntry({
        timestamp: new Date(),
        action: 'api_key_validation_failed',
        ip,
        userAgent,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        statusCode: 401,
        responseTime: Date.now() - startTime,
        details: { error: validation.error }
      });

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'unauthorized', message: validation.error },
          { status: 401, headers: getSecurityHeaders() }
        )
      };
    }

    apiKeyInfo = validation.info;
  }

  // 3. Rate Limiting
  if (config.enableRateLimit) {
    const rateLimitKey = apiKeyInfo?.id || ip;
    const rateLimitConfig = apiKeyInfo 
      ? { ...RATE_LIMIT_CONFIGS.default, maxRequests: apiKeyInfo.rateLimit }
      : RATE_LIMIT_CONFIGS.default;
    
    const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfig);

    if (!rateLimit.allowed) {
      logAuditEntry({
        timestamp: new Date(),
        action: 'rate_limit_exceeded',
        apiKeyId: apiKeyInfo?.id,
        ip,
        userAgent,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        statusCode: 429,
        responseTime: Date.now() - startTime
      });

      return {
        allowed: false,
        response: NextResponse.json(
          { 
            error: 'rate_limit_exceeded', 
            message: 'Limite de requisições excedido',
            retry_after: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
          },
          { 
            status: 429, 
            headers: {
              ...getSecurityHeaders(),
              'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(rateLimit.resetAt / 1000).toString(),
              'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString()
            }
          }
        )
      };
    }

    return {
      allowed: true,
      apiKeyInfo,
      rateLimitInfo: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      }
    };
  }

  return {
    allowed: true,
    apiKeyInfo
  };
}

// =====================================================
// UTILITÁRIOS
// =====================================================

export function getClientIp(request: NextRequest, trustedProxies: string[] = []): string {
  // Verificar headers de proxy
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    // Retornar primeiro IP que não seja de proxy confiável
    for (const ip of ips) {
      if (!trustedProxies.includes(ip)) {
        return ip;
      }
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback
  return '127.0.0.1';
}

export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validar schema de JSON
export function validateJsonSchema<T>(
  data: unknown,
  requiredFields: (keyof T)[],
  optionalFields: (keyof T)[] = []
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  // Verificar campos obrigatórios
  for (const field of requiredFields) {
    if (!(field as string in obj) || obj[field as string] === undefined) {
      errors.push(`Missing required field: ${String(field)}`);
    }
  }

  // Verificar campos desconhecidos
  const allowedFields = [...requiredFields, ...optionalFields] as string[];
  for (const key of Object.keys(obj)) {
    if (!allowedFields.includes(key)) {
      errors.push(`Unknown field: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

