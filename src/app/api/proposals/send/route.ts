import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

import { emitEvent, markEventError, markEventProcessed } from '@/lib/admin/eventBus'
import { handleEvent } from '@/lib/admin/eventHandlers'

export const dynamic = 'force-dynamic';

// POST - Enviar proposta para cliente
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: authData } = await supabase.auth.getUser()
    const actorUserId = authData.user?.id
    if (!actorUserId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const proposalId = body?.proposal_id || body?.proposalId || body?.id

    if (!proposalId) {
      return NextResponse.json(
        { error: 'ID da proposta é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar proposta
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (fetchError || !proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    if (!proposal.client_email) {
      return NextResponse.json(
        { error: 'Email do cliente não informado' },
        { status: 400 }
      )
    }

    // Gerar link da proposta
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin || 'http://localhost:3000'
    const proposalLink = `${origin}/proposta/${proposal.magic_link_token}`

    // Atualizar status para enviado
    const hasValidUntil = !!proposal.valid_until
    const validUntil = hasValidUntil
      ? proposal.valid_until
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'sent',
        valid_until: validUntil,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)

    if (updateError) throw updateError

    // Criar notificação
    const ownerId = proposal.sales_rep_id || proposal.created_by || proposal.user_id || null
    if (ownerId) {
      await supabase.from('notifications').insert({
        user_id: ownerId,
        title: 'Proposta Enviada',
        message: `Proposta para ${proposal.client_name} foi marcada como enviada.`,
        type: 'proposal',
        link: `/admin/comercial/propostas`,
        metadata: { proposal_id: proposalId }
      })
    }

    // Criar workflow transition para Jurídico (se aceita)
    // Isso será feito quando o cliente aceitar

    // TODO: Integrar com SendGrid para enviar email real
    // Por enquanto, retornamos o link para cópia manual

    // Event bus: proposal.sent (best-effort)
    try {
      const event = await emitEvent({
        eventType: 'proposal.sent',
        entityType: 'proposal',
        entityId: proposalId,
        actorUserId,
        payload: { proposal_id: proposalId, client_email: proposal.client_email, client_name: proposal.client_name }
      })

      const handled = await handleEvent(event)
      if (!handled.ok) await markEventError(event.id, handled.error)
      else await markEventProcessed(event.id)
    } catch {
      // não bloqueia
    }

    return NextResponse.json({
      success: true,
      proposal_link: proposalLink,
      message: 'Proposta enviada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao enviar proposta:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar proposta' },
      { status: 500 }
    )
  }
}






