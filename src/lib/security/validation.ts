// Input Validation - Valle 360
// Validação de dados com schemas

import { z } from 'zod';

// ============================================
// SCHEMAS COMUNS
// ============================================

// Email
export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(5, 'Email muito curto')
  .max(255, 'Email muito longo')
  .toLowerCase()
  .trim();

// Senha
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(100, 'Senha muito longa')
  .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter ao menos um número');

// Telefone BR
export const phoneSchema = z
  .string()
  .regex(/^(\+55)?[\s]?\(?[1-9]{2}\)?[\s]?9?[0-9]{4}[-\s]?[0-9]{4}$/, 'Telefone inválido')
  .transform(val => val.replace(/\D/g, ''));

// CPF
export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF inválido')
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => validateCPF(val), 'CPF inválido');

// CNPJ
export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, 'CNPJ inválido')
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => validateCNPJ(val), 'CNPJ inválido');

// UUID
export const uuidSchema = z.string().uuid('ID inválido');

// URL
export const urlSchema = z.string().url('URL inválida');

// Data
export const dateSchema = z.coerce.date();

// Moeda (em centavos)
export const currencySchema = z
  .number()
  .int('Valor deve ser inteiro (em centavos)')
  .min(0, 'Valor não pode ser negativo');

// ============================================
// SCHEMAS DE ENTIDADES
// ============================================

// Usuário
export const userSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo').trim(),
  email: emailSchema,
  password: passwordSchema.optional(),
  phone: phoneSchema.optional(),
  role: z.enum(['admin', 'super_admin', 'colaborador', 'head', 'comercial', 'financeiro', 'rh']),
  department: z.string().optional(),
  avatar: urlSchema.optional(),
  active: z.boolean().default(true)
});

export const userUpdateSchema = userSchema.partial();

// Cliente
export const clientSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(200, 'Nome muito longo').trim(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  document: z.union([cpfSchema, cnpjSchema]).optional(),
  company: z.string().max(200).optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/).optional()
  }).optional(),
  contractValue: currencySchema.optional(),
  status: z.enum(['active', 'inactive', 'pending', 'churned']).default('active')
});

// Tarefa
export const taskSchema = z.object({
  title: z.string().min(3, 'Título muito curto').max(200, 'Título muito longo').trim(),
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).default('todo'),
  assigneeId: uuidSchema.optional(),
  clientId: uuidSchema.optional(),
  dueDate: dateSchema.optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  estimatedHours: z.number().min(0).max(1000).optional()
});

// Mensagem
export const messageSchema = z.object({
  content: z.string().min(1, 'Mensagem vazia').max(5000, 'Mensagem muito longa'),
  recipientId: uuidSchema,
  attachments: z.array(z.object({
    url: urlSchema,
    name: z.string(),
    type: z.string(),
    size: z.number()
  })).max(10).optional()
});

// Aprovação
export const approvalSchema = z.object({
  itemId: uuidSchema,
  itemType: z.enum(['post', 'design', 'video', 'document', 'other']),
  status: z.enum(['pending', 'approved', 'rejected', 'revision']),
  feedback: z.string().max(1000).optional()
});

// Fatura
export const invoiceSchema = z.object({
  clientId: uuidSchema,
  items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().int().min(1),
    unitPrice: currencySchema
  })).min(1, 'Fatura deve ter ao menos um item'),
  dueDate: dateSchema,
  notes: z.string().max(1000).optional()
});

// Post Social Media
export const socialPostSchema = z.object({
  content: z.string().min(1).max(2200), // Limite do Instagram
  platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin', 'twitter'])).min(1),
  scheduledAt: dateSchema.optional(),
  mediaUrls: z.array(urlSchema).max(10).optional(),
  clientId: uuidSchema
});

// ============================================
// SCHEMAS DE REQUEST
// ============================================

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatória')
});

// Registro
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword']
});

// Reset de senha
export const resetPasswordSchema = z.object({
  email: emailSchema
});

// Nova senha
export const newPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword']
});

// Paginação
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Busca
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  ...paginationSchema.shape
});

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Validar e parsear dados com schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodIssue[];
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.issues };
}

/**
 * Validar ou lançar erro
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Formatar erros do Zod para exibição
 */
export function formatZodErrors(errors: z.ZodIssue[]): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  for (const error of errors) {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = error.message;
    }
  }
  
  return formatted;
}

/**
 * Criar resposta de erro de validação
 */
export function validationErrorResponse(errors: z.ZodIssue[]): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation Error',
      message: 'Dados inválidos',
      details: formatZodErrors(errors)
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// ============================================
// HELPERS DE VALIDAÇÃO
// ============================================

/**
 * Validar CPF
 */
function validateCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf[10])) return false;
  
  return true;
}

/**
 * Validar CNPJ
 */
function validateCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cnpj[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cnpj[13])) return false;
  
  return true;
}

/**
 * Sanitizar string (remover tags HTML, etc)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/[<>]/g, '')    // Remove < e > restantes
    .trim();
}

/**
 * Sanitizar objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : 
        item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

export default {
  validate,
  validateOrThrow,
  formatZodErrors,
  validationErrorResponse,
  sanitizeString,
  sanitizeObject,
  schemas: {
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    cpf: cpfSchema,
    cnpj: cnpjSchema,
    uuid: uuidSchema,
    url: urlSchema,
    date: dateSchema,
    currency: currencySchema,
    user: userSchema,
    userUpdate: userUpdateSchema,
    client: clientSchema,
    task: taskSchema,
    message: messageSchema,
    approval: approvalSchema,
    invoice: invoiceSchema,
    socialPost: socialPostSchema,
    login: loginSchema,
    register: registerSchema,
    resetPassword: resetPasswordSchema,
    newPassword: newPasswordSchema,
    pagination: paginationSchema,
    search: searchSchema
  }
};

