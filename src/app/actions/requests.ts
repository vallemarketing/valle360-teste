'use server';

import { supabase } from '@/lib/supabase';
import { getCurrentUserId, withUserContext } from '@/lib/db-helpers';
import { z } from 'zod';

// Schemas de validação
const CreateHomeOfficeRequestSchema = z.object({
  orgId: z.string().uuid(),
  title: z.string().min(5),
  dateFrom: z.string(), // date
  dateTo: z.string(), // date
  reason: z.string().optional(),
  location: z.string().optional(),
});

const CreateDayOffRequestSchema = z.object({
  orgId: z.string().uuid(),
  title: z.string().min(5),
  day: z.string(), // date
  halfDay: z.boolean().default(false),
  period: z.enum(['morning', 'afternoon', 'full_day']).optional(),
  reason: z.string().optional(),
});

const CreateReimbursementRequestSchema = z.object({
  orgId: z.string().uuid(),
  title: z.string().min(5),
  amount: z.number().positive(),
  currency: z.string().length(3).default('BRL'),
  category: z.string().optional(),
  merchant: z.string().optional(),
  expenseDate: z.string(), // date
  receiptPath: z.string().optional(),
  paymentMethod: z.string().optional(),
  accountNumber: z.string().optional(),
  description: z.string().optional(),
});

const ApproveRequestSchema = z.object({
  requestId: z.string().uuid(),
  notes: z.string().optional(),
});

const RejectRequestSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().min(10, 'Motivo da rejeição deve ter pelo menos 10 caracteres'),
});

// CREATE: Home Office
export async function createHomeOfficeRequest(data: z.infer<typeof CreateHomeOfficeRequestSchema>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  const validated = CreateHomeOfficeRequestSchema.parse(data);

  return withUserContext(userId, async () => {
    // Criar request principal
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        org_id: validated.orgId,
        requester_id: userId,
        type: 'home_office',
        title: validated.title,
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Criar detalhes do home office
    const { error: detailsError } = await supabase
      .from('request_home_office')
      .insert({
        request_id: request.id,
        date_from: validated.dateFrom,
        date_to: validated.dateTo,
        reason: validated.reason,
        location: validated.location,
      });

    if (detailsError) throw detailsError;

    return request;
  });
}

// CREATE: Day Off
export async function createDayOffRequest(data: z.infer<typeof CreateDayOffRequestSchema>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  const validated = CreateDayOffRequestSchema.parse(data);

  return withUserContext(userId, async () => {
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        org_id: validated.orgId,
        requester_id: userId,
        type: 'day_off',
        title: validated.title,
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) throw requestError;

    const { error: detailsError } = await supabase
      .from('request_day_off')
      .insert({
        request_id: request.id,
        day: validated.day,
        half_day: validated.halfDay,
        period: validated.period || (validated.halfDay ? 'morning' : 'full_day'),
        reason: validated.reason,
      });

    if (detailsError) throw detailsError;

    return request;
  });
}

// CREATE: Reimbursement
export async function createReimbursementRequest(data: z.infer<typeof CreateReimbursementRequestSchema>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  const validated = CreateReimbursementRequestSchema.parse(data);

  return withUserContext(userId, async () => {
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        org_id: validated.orgId,
        requester_id: userId,
        type: 'reimbursement',
        title: validated.title,
        description: validated.description,
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) throw requestError;

    const { error: detailsError } = await supabase
      .from('request_reimbursement')
      .insert({
        request_id: request.id,
        amount: validated.amount,
        currency: validated.currency,
        category: validated.category,
        merchant: validated.merchant,
        expense_date: validated.expenseDate,
        receipt_storage_path: validated.receiptPath,
        payment_method: validated.paymentMethod,
        account_number: validated.accountNumber,
      });

    if (detailsError) throw detailsError;

    return request;
  });
}

// APPROVE Request
export async function approveRequest(data: z.infer<typeof ApproveRequestSchema>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  const validated = ApproveRequestSchema.parse(data);

  return withUserContext(userId, async () => {
    const { data: request, error } = await supabase
      .from('requests')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        notes: validated.notes,
      })
      .eq('id', validated.requestId)
      .select()
      .single();

    if (error) throw error;

    // Criar notificação para o solicitante
    await supabase.from('alerts').insert({
      org_id: request.org_id,
      user_id: request.requester_id,
      kind: 'request_approved',
      severity: 'success',
      title: 'Solicitação Aprovada',
      message: `Sua solicitação "${request.title}" foi aprovada!`,
    });

    return request;
  });
}

// REJECT Request
export async function rejectRequest(data: z.infer<typeof RejectRequestSchema>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  const validated = RejectRequestSchema.parse(data);

  return withUserContext(userId, async () => {
    const { data: request, error } = await supabase
      .from('requests')
      .update({
        status: 'rejected',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        rejected_reason: validated.reason,
      })
      .eq('id', validated.requestId)
      .select()
      .single();

    if (error) throw error;

    // Criar notificação para o solicitante
    await supabase.from('alerts').insert({
      org_id: request.org_id,
      user_id: request.requester_id,
      kind: 'request_rejected',
      severity: 'warning',
      title: 'Solicitação Rejeitada',
      message: `Sua solicitação "${request.title}" foi rejeitada. Motivo: ${validated.reason}`,
    });

    return request;
  });
}

// CANCEL Request (pelo próprio solicitante)
export async function cancelRequest(requestId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { data, error } = await supabase
      .from('requests')
      .update({ status: 'canceled' })
      .eq('id', requestId)
      .eq('requester_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  });
}

// GET: Lista de solicitações por organização
export async function getOrganizationRequests(orgId: string, filters?: {
  type?: string;
  status?: string;
  requesterId?: string;
}) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    let query = supabase
      .from('requests')
      .select(`
        *,
        requester:user_profiles!requests_requester_id_fkey(full_name, avatar_url, email),
        approver:user_profiles!requests_approved_by_fkey(full_name)
      `)
      .eq('org_id', orgId)
      .order('submitted_at', { ascending: false });

    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.requesterId) query = query.eq('requester_id', filters.requesterId);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  });
}

// GET: Minhas solicitações
export async function getMyRequests(orgId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        approver:user_profiles!requests_approved_by_fkey(full_name)
      `)
      .eq('org_id', orgId)
      .eq('requester_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  });
}

// GET: Detalhes da solicitação com dados específicos
export async function getRequestDetails(requestId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        requester:user_profiles!requests_requester_id_fkey(full_name, avatar_url, email),
        approver:user_profiles!requests_approved_by_fkey(full_name)
      `)
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    let details = null;

    // Buscar detalhes específicos baseado no tipo
    switch (request.type) {
      case 'home_office':
        const { data: hoData } = await supabase
          .from('request_home_office')
          .select('*')
          .eq('request_id', requestId)
          .single();
        details = hoData;
        break;

      case 'day_off':
        const { data: doData } = await supabase
          .from('request_day_off')
          .select('*')
          .eq('request_id', requestId)
          .single();
        details = doData;
        break;

      case 'reimbursement':
        const { data: reimbData } = await supabase
          .from('request_reimbursement')
          .select('*')
          .eq('request_id', requestId)
          .single();
        details = reimbData;
        break;
    }

    return {
      ...request,
      details,
    };
  });
}
