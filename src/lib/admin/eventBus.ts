import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabaseAdmin';

export type EventStatus = 'pending' | 'processed' | 'error';

export interface DomainEventInput {
  eventType: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string | null;
  payload?: Record<string, unknown>;
  correlationId?: string;
}

export interface DomainEventRow {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_user_id: string | null;
  payload: Record<string, unknown>;
  status: EventStatus;
  error_message: string | null;
  correlation_id: string | null;
  created_at: string;
  processed_at: string | null;
}

export function createCorrelationId() {
  // uuid v4 "leve" sem deps: suficiente para correlacionar eventos
  // NOTE: não é para segurança criptográfica.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function emitEvent(input: DomainEventInput, admin?: SupabaseClient) {
  const supabase = admin ?? getSupabaseAdmin();
  const correlationId = input.correlationId || createCorrelationId();

  const { data, error } = await supabase
    .from('event_log')
    .insert({
      event_type: input.eventType,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      actor_user_id: input.actorUserId || null,
      payload: input.payload || {},
      status: 'pending',
      correlation_id: correlationId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as DomainEventRow;
}

export async function markEventProcessed(eventId: string, admin?: SupabaseClient) {
  const supabase = admin ?? getSupabaseAdmin();
  const { error } = await supabase
    .from('event_log')
    .update({ status: 'processed', processed_at: new Date().toISOString(), error_message: null })
    .eq('id', eventId);
  if (error) throw error;
}

export async function markEventError(eventId: string, message: string, admin?: SupabaseClient) {
  const supabase = admin ?? getSupabaseAdmin();
  const { error } = await supabase
    .from('event_log')
    .update({ status: 'error', processed_at: new Date().toISOString(), error_message: message })
    .eq('id', eventId);
  if (error) throw error;
}


