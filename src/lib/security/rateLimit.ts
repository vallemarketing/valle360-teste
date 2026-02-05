// Rate Limiting - Valle 360
// Proteção contra abuso de APIs

interface RateLimitConfig {
  windowMs: number;      // Janela de tempo em ms
  maxRequests: number;   // Máximo de requisições por janela
  message?: string;      // Mensagem de erro
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store em memória (em produção, usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas periodicamente
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Limpar a cada minuto
}

// Configurações padrão por tipo de endpoint
export const RATE_LIMIT_CONFIGS = {
  // APIs públicas - mais restritivo
  public: {
    windowMs: 60 * 1000,      // 1 minuto
    maxRequests: 30,
    message: 'Muitas requisições. Tente novamente em 1 minuto.'
  },
  
  // APIs autenticadas - moderado
  authenticated: {
    windowMs: 60 * 1000,      // 1 minuto
    maxRequests: 100,
    message: 'Limite de requisições atingido. Aguarde um momento.'
  },
  
  // APIs de admin - mais permissivo
  admin: {
    windowMs: 60 * 1000,      // 1 minuto
    maxRequests: 200,
    message: 'Limite de requisições atingido.'
  },
  
  // Login/Auth - muito restritivo
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  
  // Envio de emails/WhatsApp - restritivo
  messaging: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 50,
    message: 'Limite de envio de mensagens atingido.'
  },
  
  // Upload de arquivos
  upload: {
    windowMs: 60 * 1000,      // 1 minuto
    maxRequests: 10,
    message: 'Muitos uploads. Aguarde um momento.'
  },
  
  // Webhooks externos
  webhook: {
    windowMs: 1000,           // 1 segundo
    maxRequests: 10,
    message: 'Rate limit exceeded.'
  }
};

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

/**
 * Verifica se uma requisição está dentro do limite
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'authenticated'
): { allowed: boolean; remaining: number; resetIn: number; message?: string } {
  const config = RATE_LIMIT_CONFIGS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // Se não existe ou expirou, criar nova entrada
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs
    };
  }
  
  // Incrementar contador
  entry.count++;
  
  // Verificar se excedeu
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
      message: config.message
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now
  };
}

/**
 * Middleware de rate limiting para API routes
 */
export function rateLimitMiddleware(type: RateLimitType = 'authenticated') {
  return async (request: Request): Promise<Response | null> => {
    // Obter identificador (IP ou user ID)
    const identifier = getIdentifier(request);
    const result = checkRateLimit(identifier, type);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: result.message,
          retryAfter: Math.ceil(result.resetIn / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS[type].maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString()
          }
        }
      );
    }
    
    // Retorna null para indicar que pode continuar
    return null;
  };
}

/**
 * Obter identificador único para rate limiting
 */
function getIdentifier(request: Request): string {
  // Tentar obter IP do header (Vercel, Cloudflare, etc)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback para um identificador genérico
  return 'unknown';
}

/**
 * Helper para usar em API routes
 */
export async function withRateLimit(
  request: Request,
  type: RateLimitType = 'authenticated'
): Promise<{ allowed: boolean; response?: Response; headers: Record<string, string> }> {
  const identifier = getIdentifier(request);
  const result = checkRateLimit(identifier, type);
  const config = RATE_LIMIT_CONFIGS[type];
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString()
  };
  
  if (!result.allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: result.message,
          retryAfter: Math.ceil(result.resetIn / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
            ...headers
          }
        }
      ),
      headers
    };
  }
  
  return { allowed: true, headers };
}

/**
 * Resetar rate limit para um identificador (útil após login bem-sucedido)
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const key = `${type}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Obter status atual do rate limit
 */
export function getRateLimitStatus(identifier: string, type: RateLimitType): {
  count: number;
  limit: number;
  remaining: number;
  resetIn: number;
} {
  const config = RATE_LIMIT_CONFIGS[type];
  const key = `${type}:${identifier}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!entry || entry.resetTime < now) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetIn: config.windowMs
    };
  }
  
  return {
    count: entry.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetIn: entry.resetTime - now
  };
}

export default {
  checkRateLimit,
  withRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS
};









