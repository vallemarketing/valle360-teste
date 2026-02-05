import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic';

// GET - Listar propostas
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('client_id')

    let query = supabase
      .from('commercial_proposals')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ proposals: data })
  } catch (error) {
    console.error('Erro ao buscar propostas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar propostas' },
      { status: 500 }
    )
  }
}

// POST - Criar nova proposta
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const body = await request.json()
    const {
      client_id,
      client_name,
      client_email,
      lead_id,
      services,
      discount_percent,
      payment_terms,
      validity_days,
      notes,
      internal_notes
    } = body

    // Calcular valores
    const subtotal = services.reduce((sum: number, s: any) => {
      return sum + (s.price * (s.quantity || 1))
    }, 0)

    const discountValue = subtotal * ((discount_percent || 0) / 100)
    const total = subtotal - discountValue

    // Gerar magic link token
    const magicLinkToken = uuidv4()

    // Calcular data de validade
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (validity_days || 30))

    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('commercial_proposals')
      .insert({
        client_id,
        client_name,
        client_email,
        lead_id,
        created_by: user?.id,
        status: 'draft',
        services,
        subtotal,
        discount_percent: discount_percent || 0,
        discount_value: discountValue,
        total,
        payment_terms,
        validity_days: validity_days || 30,
        valid_until: validUntil.toISOString().split('T')[0],
        notes,
        internal_notes,
        magic_link_token: magicLinkToken
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ proposal: data })
  } catch (error) {
    console.error('Erro ao criar proposta:', error)
    return NextResponse.json(
      { error: 'Erro ao criar proposta' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar proposta
export async function PUT(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID da proposta é obrigatório' },
        { status: 400 }
      )
    }

    // Se estiver atualizando serviços, recalcular valores
    if (updateData.services) {
      const subtotal = updateData.services.reduce((sum: number, s: any) => {
        return sum + (s.price * (s.quantity || 1))
      }, 0)

      const discountPercent = updateData.discount_percent || 0
      const discountValue = subtotal * (discountPercent / 100)
      const total = subtotal - discountValue

      updateData.subtotal = subtotal
      updateData.discount_value = discountValue
      updateData.total = total
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('commercial_proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ proposal: data })
  } catch (error) {
    console.error('Erro ao atualizar proposta:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar proposta' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir proposta
export async function DELETE(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da proposta é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('commercial_proposals')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir proposta:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir proposta' },
      { status: 500 }
    )
  }
}






