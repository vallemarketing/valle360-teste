import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';

function normalizeCpanelBaseUrl(raw: string) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''

  const withScheme =
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  // Remove trailing slash
  return withScheme.replace(/\/+$/, '')
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Somente admin
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin')
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Extrair username e domain do email
    const [username, domain] = email.split('@')
    if (!username || !domain) {
      return NextResponse.json(
        { success: false, message: 'Email inválido (formato esperado: usuario@dominio)' },
        { status: 400 }
      )
    }

    // Credenciais do cPanel
    const cpanelUser = process.env.CPANEL_USER
    const cpanelPassword = process.env.CPANEL_PASSWORD
    const cpanelDomain = process.env.CPANEL_DOMAIN

    if (!cpanelUser || !cpanelPassword || !cpanelDomain) {
      console.warn('⚠️ Credenciais do cPanel não configuradas')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Credenciais do cPanel não configuradas',
          email,
          skipped: true
        },
        { status: 200 }
      )
    }

    // Criar Basic Auth
    const basicAuth = Buffer.from(`${cpanelUser}:${cpanelPassword}`).toString('base64')

    // Construir URL da API do cPanel (UAPI) para deletar email
    const baseUrl = normalizeCpanelBaseUrl(cpanelDomain)
    const apiUrl = `${baseUrl}/execute/Email/delete_pop?email=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`

    console.log(`🗑️ Tentando deletar email no cPanel: ${email}`)

    // Fazer requisição para o cPanel
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      }
    })

    // Verificar se a resposta é JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ cPanel retornou HTML ao invés de JSON:', text.substring(0, 200))
      return NextResponse.json({
        success: false,
        message: 'cPanel retornou resposta inválida. Verifique CPANEL_DOMAIN.',
        hint: 'CPANEL_DOMAIN deve ser algo como: https://seu-servidor.com:2083',
        email,
        skipped: true
      }, { status: 200 })
    }

    const data = await response.json()

    if (data.result?.status === 1 || data.status === 1) {
      console.log(`✅ Email deletado do cPanel: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Email deletado com sucesso do cPanel',
        email
      })
    } else {
      // Se o email não existe, considerar como sucesso
      const errors = data.result?.errors || data.errors || []
      const emailNotExists = errors.some((e: string) => 
        e.toLowerCase().includes('does not exist') || 
        e.toLowerCase().includes('não existe')
      )
      
      if (emailNotExists) {
        console.log(`ℹ️ Email já não existe no cPanel: ${email}`)
        return NextResponse.json({
          success: true,
          message: 'Email não existe no cPanel (já foi removido)',
          email
        })
      }

      console.error('❌ Erro ao deletar email no cPanel:', errors)
      return NextResponse.json({
        success: false,
        message: 'Erro ao deletar email no cPanel',
        errors,
        email
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Erro na API de exclusão de email:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido',
      skipped: true
    }, { status: 500 })
  }
}
