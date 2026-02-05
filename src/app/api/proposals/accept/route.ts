import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

import { emitEvent, markEventError, markEventProcessed } from '@/lib/admin/eventBus'
import { handleEvent } from '@/lib/admin/eventHandlers'
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin'

export const dynamic = 'force-dynamic';

function mapProposalForPublicPage(proposal: any) {
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const services = items.map((it: any) => ({
    name: it?.name || 'Serviço',
    description: it?.description,
    price: Number(it?.price || 0),
    quantity: Number(it?.quantity || 1),
    features: it?.features,
  }));

  const total = Number(proposal.total_value || 0);
  const subtotal = services.reduce((sum: number, s: any) => sum + (Number(s.price) * Number(s.quantity || 1)), 0) || total;

  const validUntil = proposal.valid_until
    ? new Date(proposal.valid_until).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    client_name: proposal.client_name,
    services,
    subtotal,
    discount_percent: 0,
    discount_value: 0,
    total: total || subtotal,
    payment_terms: 'Mensal',
    valid_until: validUntil,
    notes: '',
    status: proposal.status,
  };
}

// POST - Cliente aceita proposta
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { magic_link_token, action, rejection_reason } = await request.json()

    if (!magic_link_token) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      )
    }

    // Buscar proposta pelo token
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('magic_link_token', magic_link_token)
      .single()

    if (fetchError || !proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se proposta já foi processada
    if (['accepted', 'rejected', 'expired'].includes(proposal.status)) {
      return NextResponse.json(
        { error: `Proposta já foi ${proposal.status === 'accepted' ? 'aceita' : proposal.status === 'rejected' ? 'rejeitada' : 'expirada'}` },
        { status: 400 }
      )
    }

    // Verificar validade
    const validUntil = proposal.valid_until ? new Date(proposal.valid_until) : null
    if (validUntil && validUntil < new Date()) {
      await supabase
        .from('proposals')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', proposal.id)

      return NextResponse.json(
        { error: 'Proposta expirada' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      // Atualizar proposta como aceita
      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.id)

      if (updateError) throw updateError

      const ownerId = proposal.sales_rep_id || proposal.created_by || proposal.user_id || null
      if (ownerId) {
        await supabase.from('notifications').insert({
          user_id: ownerId,
          title: '🎉 Proposta Aceita!',
          message: `${proposal.client_name} aceitou a proposta.`,
          type: 'proposal_accepted',
          link: `/admin/comercial/propostas`,
          metadata: { proposal_id: proposal.id }
        })
      }

      // Event bus: proposal.accepted (best-effort)
      try {
        const admin = getSupabaseAdmin()
        const event = await emitEvent({
          eventType: 'proposal.accepted',
          entityType: 'proposal',
          entityId: proposal.id,
          actorUserId: null,
          payload: { proposal_id: proposal.id, client_email: proposal.client_email, client_name: proposal.client_name }
        }, admin)
        const handled = await handleEvent(event)
        if (!handled.ok) await markEventError(event.id, handled.error, admin)
        else await markEventProcessed(event.id, admin)
      } catch {
        // não bloqueia o aceite
      }

      return NextResponse.json({
        success: true,
        message: 'Proposta aceita com sucesso! Em breve você receberá o contrato.',
        next_step: 'contract'
      })
    } else if (action === 'reject') {
      // Atualizar proposta como rejeitada
      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.id)

      if (updateError) throw updateError

      const ownerId = proposal.sales_rep_id || proposal.created_by || proposal.user_id || null
      if (ownerId) {
        await supabase.from('notifications').insert({
          user_id: ownerId,
          title: 'Proposta Rejeitada',
          message: `${proposal.client_name} rejeitou a proposta. Motivo: ${rejection_reason || 'Não informado'}`,
          type: 'proposal_rejected',
          link: `/admin/comercial/propostas`,
          metadata: { proposal_id: proposal.id }
        })
      }

      // Event bus: proposal.rejected (best-effort)
      try {
        const admin = getSupabaseAdmin()
        const event = await emitEvent({
          eventType: 'proposal.rejected',
          entityType: 'proposal',
          entityId: proposal.id,
          actorUserId: null,
          payload: { proposal_id: proposal.id, client_email: proposal.client_email, client_name: proposal.client_name, reason: rejection_reason || null }
        }, admin)
        const handled = await handleEvent(event)
        if (!handled.ok) await markEventError(event.id, handled.error, admin)
        else await markEventProcessed(event.id, admin)
      } catch {
        // não bloqueia
      }

      return NextResponse.json({
        success: true,
        message: 'Proposta rejeitada.'
      })
    } else if (action === 'view') {
      // Apenas registrar visualização
      // Se estava como 'sent', marcar como 'viewed'
      if (proposal.status === 'sent') {
        await supabase
          .from('proposals')
          .update({ status: 'viewed', updated_at: new Date().toISOString() })
          .eq('id', proposal.id)
      }

      return NextResponse.json({
        success: true,
        proposal: mapProposalForPublicPage(proposal)
      })
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro ao processar proposta:', error)
    return NextResponse.json(
      { error: 'Erro ao processar proposta' },
      { status: 500 }
    )
  }
}






