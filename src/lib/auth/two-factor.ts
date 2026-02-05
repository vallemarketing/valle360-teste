/**
 * Valle 360 - Two-Factor Authentication (2FA)
 * Implementação de autenticação em dois fatores usando TOTP
 */

import { createClient } from '@supabase/supabase-js';

// =====================================================
// TIPOS
// =====================================================

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  valid: boolean;
  error?: string;
}

// =====================================================
// GERAÇÃO DE CÓDIGOS
// =====================================================

/**
 * Gera um secret base32 para TOTP
 */
export function generateTotpSecret(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const randomValues = new Uint8Array(20);
  crypto.getRandomValues(randomValues);
  
  for (const value of randomValues) {
    secret += charset[value % charset.length];
  }
  
  return secret;
}

/**
 * Gera códigos de backup para recuperação
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomValues = new Uint8Array(4);
    crypto.getRandomValues(randomValues);
    const code = Array.from(randomValues)
      .map(v => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Gera URL para QR Code (otpauth://)
 */
export function generateQrCodeUrl(
  secret: string,
  email: string,
  issuer: string = 'Valle360'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// =====================================================
// VERIFICAÇÃO TOTP
// =====================================================

/**
 * Converte base32 para bytes
 */
function base32ToBytes(base32: string): Uint8Array {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits: number[] = [];
  
  for (const char of base32.toUpperCase()) {
    const index = charset.indexOf(char);
    if (index === -1) continue;
    
    for (let i = 4; i >= 0; i--) {
      bits.push((index >> i) & 1);
    }
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    bytes[i] = byte;
  }
  
  return bytes;
}

/**
 * Calcula HMAC-SHA1 (simplificado, usar biblioteca em produção)
 */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC', 
    cryptoKey, 
    message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength) as ArrayBuffer
  );
  return new Uint8Array(signature);
}

/**
 * Gera código TOTP para um timestamp
 */
async function generateTotpCode(secret: string, timestamp: number): Promise<string> {
  const timeStep = Math.floor(timestamp / 30000);
  const key = base32ToBytes(secret);
  
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigUint64(0, BigInt(timeStep), false);
  
  const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
  const offset = hmac[hmac.length - 1] & 0x0f;
  
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

/**
 * Verifica código TOTP (permite janela de ±1)
 */
export async function verifyTotpCode(
  secret: string,
  code: string,
  windowSize: number = 1
): Promise<boolean> {
  const now = Date.now();
  
  for (let i = -windowSize; i <= windowSize; i++) {
    const timestamp = now + (i * 30000);
    const expectedCode = await generateTotpCode(secret, timestamp);
    
    if (code === expectedCode) {
      return true;
    }
  }
  
  return false;
}

// =====================================================
// FUNÇÕES DE SUPABASE
// =====================================================

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Configura 2FA para um usuário
 */
export async function setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetup | null> {
  try {
    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes();
    const qrCodeUrl = generateQrCodeUrl(secret, email);
    
    const supabase = supabaseAdmin();
    
    // Hash dos backup codes antes de salvar
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(async code => {
        const encoder = new TextEncoder();
        const data = encoder.encode(code);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      })
    );
    
    // Salvar no banco (não ativar ainda)
    const { error } = await supabase
      .from('user_2fa')
      .upsert({
        user_id: userId,
        secret: secret, // Em produção, criptografar antes de salvar
        backup_codes: hashedBackupCodes,
        is_enabled: false, // Só ativa após verificação
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error setting up 2FA:', error);
      return null;
    }
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  } catch (error) {
    console.error('Error in setupTwoFactor:', error);
    return null;
  }
}

/**
 * Verifica e ativa 2FA
 */
export async function enableTwoFactor(userId: string, code: string): Promise<TwoFactorVerification> {
  try {
    const supabase = supabaseAdmin();
    
    // Buscar configuração pendente
    const { data, error } = await supabase
      .from('user_2fa')
      .select('secret')
      .eq('user_id', userId)
      .eq('is_enabled', false)
      .single();
    
    if (error || !data) {
      return { valid: false, error: '2FA não configurado' };
    }
    
    // Verificar código
    const isValid = await verifyTotpCode(data.secret, code);
    
    if (!isValid) {
      return { valid: false, error: 'Código inválido' };
    }
    
    // Ativar 2FA
    await supabase
      .from('user_2fa')
      .update({ is_enabled: true, enabled_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    return { valid: true };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return { valid: false, error: 'Erro ao ativar 2FA' };
  }
}

/**
 * Verifica código 2FA durante login
 */
export async function verifyTwoFactor(userId: string, code: string): Promise<TwoFactorVerification> {
  try {
    const supabase = supabaseAdmin();
    
    // Buscar configuração
    const { data, error } = await supabase
      .from('user_2fa')
      .select('secret, backup_codes')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .single();
    
    if (error || !data) {
      return { valid: false, error: '2FA não habilitado' };
    }
    
    // Tentar verificar como TOTP
    const isValidTotp = await verifyTotpCode(data.secret, code);
    
    if (isValidTotp) {
      return { valid: true };
    }
    
    // Tentar verificar como código de backup
    const encoder = new TextEncoder();
    const codeData = encoder.encode(code.toUpperCase());
    const codeHash = await crypto.subtle.digest('SHA-256', codeData);
    const codeHashHex = Array.from(new Uint8Array(codeHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const backupCodes = data.backup_codes as string[];
    const backupIndex = backupCodes.indexOf(codeHashHex);
    
    if (backupIndex !== -1) {
      // Remover código de backup usado
      backupCodes.splice(backupIndex, 1);
      
      await supabase
        .from('user_2fa')
        .update({ backup_codes: backupCodes })
        .eq('user_id', userId);
      
      return { valid: true };
    }
    
    return { valid: false, error: 'Código inválido' };
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return { valid: false, error: 'Erro ao verificar 2FA' };
  }
}

/**
 * Verifica se usuário tem 2FA habilitado
 */
export async function hasTwoFactorEnabled(userId: string): Promise<boolean> {
  try {
    const supabase = supabaseAdmin();
    
    const { data, error } = await supabase
      .from('user_2fa')
      .select('is_enabled')
      .eq('user_id', userId)
      .single();
    
    return !error && data?.is_enabled === true;
  } catch {
    return false;
  }
}

/**
 * Desabilita 2FA
 */
export async function disableTwoFactor(userId: string, code: string): Promise<TwoFactorVerification> {
  // Primeiro verificar o código atual
  const verification = await verifyTwoFactor(userId, code);
  
  if (!verification.valid) {
    return verification;
  }
  
  try {
    const supabase = supabaseAdmin();
    
    await supabase
      .from('user_2fa')
      .delete()
      .eq('user_id', userId);
    
    return { valid: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return { valid: false, error: 'Erro ao desabilitar 2FA' };
  }
}

// =====================================================
// LOGIN THROTTLING
// =====================================================

export interface LoginThrottleResult {
  allowed: boolean;
  remainingAttempts?: number;
  lockoutUntil?: Date;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Verifica se o login está permitido (anti brute-force)
 */
export async function checkLoginThrottle(
  email: string,
  ip: string
): Promise<LoginThrottleResult> {
  try {
    const supabase = supabaseAdmin();
    
    // Contar tentativas recentes
    const windowStart = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .or(`email.eq.${email},ip_address.eq.${ip}`)
      .eq('success', false)
      .gte('created_at', windowStart);
    
    if (error) {
      console.error('Error checking login throttle:', error);
      return { allowed: true }; // Fail open em caso de erro
    }
    
    const attempts = count || 0;
    
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      // Buscar quando foi a última tentativa para calcular lockout
      const { data: lastAttempt } = await supabase
        .from('login_attempts')
        .select('created_at')
        .or(`email.eq.${email},ip_address.eq.${ip}`)
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const lockoutUntil = lastAttempt
        ? new Date(new Date(lastAttempt.created_at).getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutUntil
      };
    }
    
    return {
      allowed: true,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts
    };
  } catch (error) {
    console.error('Error in checkLoginThrottle:', error);
    return { allowed: true };
  }
}

/**
 * Registra tentativa de login
 */
export async function recordLoginAttempt(
  email: string,
  ip: string,
  success: boolean,
  userAgent?: string
): Promise<void> {
  try {
    const supabase = supabaseAdmin();
    
    await supabase
      .from('login_attempts')
      .insert({
        email,
        ip_address: ip,
        success,
        user_agent: userAgent
      });
    
    // Se falhou muitas vezes, criar evento de segurança
    if (!success) {
      const { count } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());
      
      if (count && count >= MAX_LOGIN_ATTEMPTS) {
        await supabase
          .from('security_events')
          .insert({
            event_type: 'brute_force_detected',
            severity: 'high',
            ip_address: ip,
            user_agent: userAgent,
            details: { email, attempts: count }
          });
      }
    }
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
}

// =====================================================
// EXPORTS DEFAULT
// =====================================================

export default {
  // 2FA
  generateTotpSecret,
  generateBackupCodes,
  generateQrCodeUrl,
  verifyTotpCode,
  setupTwoFactor,
  enableTwoFactor,
  verifyTwoFactor,
  hasTwoFactorEnabled,
  disableTwoFactor,
  
  // Throttling
  checkLoginThrottle,
  recordLoginAttempt
};

