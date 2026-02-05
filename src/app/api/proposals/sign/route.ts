import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    // Inicializar Supabase Admin (Service Role seria ideal aqui, mas usaremos o client padrão com RLS ou auth user context se possível)
    // Como é uma rota pública, precisamos de uma forma de validar e agir como admin ou sistema.
    // A melhor prática seria usar SERVICE_ROLE_KEY, mas ela não está exposta no cliente.
    // Vamos usar o cookie client, mas isso exigiria que quem assina esteja logado? Não.
    // O token mágico deve ser a autorização.
    // Precisamos da SUPABASE_SERVICE_ROLE_KEY para fazer operações "sudo" sem login.
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Service Role Key faltando para assinatura de contrato')
      return NextResponse.json({ error: 'Erro de configuração no servidor' }, { status: 500 })
    }

    // Importar createClient do pacote core para usar service key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 1. Buscar e Validar Proposta
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('proposals')
      .select('*')
      .eq('magic_link_token', token)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposta inválida ou expirada' }, { status: 404 })
    }

    if (proposal.status === 'accepted') {
      return NextResponse.json({ message: 'Proposta já foi aceita anteriormente' })
    }

    // 2. Verificar ou Criar Cliente
    // Tenta achar cliente pelo email da proposta
    let clientId = null
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('contact_email', proposal.client_email)
      .single()

    if (existingClient) {
      clientId = existingClient.id
    } else {
      // Criar novo cliente
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          company_name: proposal.client_name,
          contact_name: proposal.client_name, // Fallback
          contact_email: proposal.client_email,
          status: 'active'
        })
        .select()
        .single()
      
      if (clientError) throw clientError
      clientId = newClient.id
    }

    // 3. Atualizar Proposta
    const { error: updateError } = await supabaseAdmin
      .from('proposals')
      .update({ status: 'accepted' })
      .eq('id', proposal.id)

    if (updateError) throw updateError

    // 4. Criar Contrato (Isso dispara o Trigger de Distribuição de Tarefas)
    const { error: contractError } = await supabaseAdmin
      .from('contracts')
      .insert({
        proposal_id: proposal.id,
        client_id: clientId,
        title: `Contrato - ${proposal.client_name}`,
        start_date: new Date().toISOString(), // Começa hoje
        value: proposal.total_value,
        payment_frequency: 'monthly',
        active: true, // TRIGGER VAI RODAR AQUI
        status: 'active'
      })

    if (contractError) throw contractError

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao assinar proposta:', error)
    return NextResponse.json({ error: 'Erro interno ao processar assinatura' }, { status: 500 })
  }
}

