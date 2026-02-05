/**
 * Valle 360 - Frontend Security Module
 * Sanitização XSS, CSRF Protection, e utilitários de segurança
 */

import DOMPurify from 'isomorphic-dompurify';

// =====================================================
// SANITIZAÇÃO XSS
// =====================================================

/**
 * Sanitiza HTML para prevenir XSS
 * Remove scripts, event handlers e outras tags perigosas
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'], // Adiciona target="_blank" automaticamente
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });
}

/**
 * Sanitiza string removendo todas as tags HTML
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Escapa caracteres especiais HTML
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
}

/**
 * Sanitiza URL para prevenir javascript: e data: URLs maliciosos
 */
export function sanitizeUrl(url: string): string {
  const sanitized = url.trim().toLowerCase();
  
  // Bloquear protocolos perigosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  for (const protocol of dangerousProtocols) {
    if (sanitized.startsWith(protocol)) {
      return '';
    }
  }
  
  // Permitir apenas URLs relativas ou com protocolos seguros
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  const hasProtocol = safeProtocols.some(p => sanitized.startsWith(p));
  const isRelative = sanitized.startsWith('/') || sanitized.startsWith('#');
  
  if (!hasProtocol && !isRelative) {
    return '';
  }
  
  return url;
}

// =====================================================
// PROTEÇÃO CSRF
// =====================================================

const CSRF_TOKEN_KEY = 'valle_csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Gera token CSRF
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Armazena token CSRF no sessionStorage
 */
export function storeCsrfToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }
}

/**
 * Recupera token CSRF do sessionStorage
 */
export function getCsrfToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(CSRF_TOKEN_KEY);
  }
  return null;
}

/**
 * Garante que um token CSRF existe (gera se necessário)
 */
export function ensureCsrfToken(): string {
  let token = getCsrfToken();
  if (!token) {
    token = generateCsrfToken();
    storeCsrfToken(token);
  }
  return token;
}

/**
 * Adiciona token CSRF aos headers de uma requisição
 */
export function addCsrfHeader(headers: Headers | Record<string, string>): void {
  const token = ensureCsrfToken();
  if (headers instanceof Headers) {
    headers.set(CSRF_HEADER, token);
  } else {
    headers[CSRF_HEADER] = token;
  }
}

// =====================================================
// VALIDAÇÃO DE INPUTS
// =====================================================

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida força da senha
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  
  // Comprimento mínimo
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  // Letras maiúsculas
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Adicione letras maiúsculas');
  }
  
  // Letras minúsculas
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Adicione letras minúsculas');
  }
  
  // Números
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Adicione números');
  }
  
  // Caracteres especiais
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('Adicione caracteres especiais');
  }
  
  return {
    score: Math.min(score, 4),
    feedback,
    isStrong: score >= 4
  };
}

/**
 * Valida UUID
 */
export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Valida telefone brasileiro
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Valida CPF
 */
export function isValidCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Valida CNPJ
 */
export function isValidCnpj(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  let remainder = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (remainder !== parseInt(cleaned.charAt(12))) return false;
  
  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  remainder = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (remainder !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
}

// =====================================================
// SECURE FETCH WRAPPER
// =====================================================

interface SecureFetchOptions extends RequestInit {
  includeCsrf?: boolean;
}

/**
 * Wrapper seguro para fetch com CSRF e sanitização
 */
export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {}
): Promise<Response> {
  const { includeCsrf = true, ...fetchOptions } = options;
  
  // Sanitizar URL
  const sanitizedUrl = sanitizeUrl(url);
  if (!sanitizedUrl) {
    throw new Error('Invalid URL');
  }
  
  // Inicializar headers
  const headers = new Headers(fetchOptions.headers);
  
  // Adicionar CSRF token para métodos que modificam dados
  if (includeCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method || 'GET')) {
    addCsrfHeader(headers);
  }
  
  // Adicionar content-type se não existir
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  return fetch(sanitizedUrl, {
    ...fetchOptions,
    headers,
    credentials: 'same-origin' // Incluir cookies apenas para same-origin
  });
}

// =====================================================
// STORAGE SEGURO
// =====================================================

const STORAGE_PREFIX = 'valle_';

/**
 * Armazena dados de forma segura no localStorage
 * Adiciona prefixo e valida input
 */
export function secureSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  
  const sanitizedKey = sanitizeText(key);
  const prefixedKey = STORAGE_PREFIX + sanitizedKey;
  
  try {
    localStorage.setItem(prefixedKey, value);
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Recupera dados do localStorage de forma segura
 */
export function secureGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const sanitizedKey = sanitizeText(key);
  const prefixedKey = STORAGE_PREFIX + sanitizedKey;
  
  try {
    return localStorage.getItem(prefixedKey);
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return null;
  }
}

/**
 * Remove item do localStorage de forma segura
 */
export function secureRemoveItem(key: string): void {
  if (typeof window === 'undefined') return;
  
  const sanitizedKey = sanitizeText(key);
  const prefixedKey = STORAGE_PREFIX + sanitizedKey;
  
  try {
    localStorage.removeItem(prefixedKey);
  } catch (e) {
    console.error('Failed to remove from localStorage:', e);
  }
}

// =====================================================
// RATE LIMITING CLIENT-SIDE
// =====================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiter client-side para prevenir spam de cliques
 */
export function clientRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 1000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxAttempts) {
    return false;
  }
  
  entry.count++;
  return true;
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  // Sanitização
  sanitizeHtml,
  sanitizeText,
  escapeHtml,
  sanitizeUrl,
  
  // CSRF
  generateCsrfToken,
  storeCsrfToken,
  getCsrfToken,
  ensureCsrfToken,
  addCsrfHeader,
  
  // Validação
  isValidEmail,
  checkPasswordStrength,
  isValidUuid,
  isValidBrazilianPhone,
  isValidCpf,
  isValidCnpj,
  
  // Fetch seguro
  secureFetch,
  
  // Storage
  secureSetItem,
  secureGetItem,
  secureRemoveItem,
  
  // Rate limiting
  clientRateLimit
};
