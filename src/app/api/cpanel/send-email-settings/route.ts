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

/**
 * API para enviar configurações de email usando cPanel
 * Usa a função dispatch_client_settings do cPanel
 * Referência: https://api.docs.cpanel.net/openapi/cpanel/operation/dispatch_client_settings/
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Somente admin (provisionamento de mailbox)
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin')
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 })
    }

    const { emailCorporativo, emailPessoal } = await request.json()

    if (!emailCorporativo || !emailPessoal) {
      return NextResponse.json(
        { error: 'Email corporativo e email pessoal são obrigatórios' },
        { status: 400 }
      )
    }

    // Extrair username do email
    const [username] = emailCorporativo.split('@')

    // Credenciais do cPanel
    const cpanelUser = process.env.CPANEL_USER
    const cpanelPassword = process.env.CPANEL_PASSWORD
    const cpanelDomain = process.env.CPANEL_DOMAIN

    if (!cpanelUser || !cpanelPassword || !cpanelDomain) {
      console.warn('⚠️ Credenciais do cPanel não configuradas')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Credenciais do cPanel não configuradas. Configure CPANEL_USER, CPANEL_PASSWORD e CPANEL_DOMAIN (ex.: https://SEU_HOST:2083).'
        },
        { status: 200 }
      )
    }

    // Criar Basic Auth
    const basicAuth = Buffer.from(`${cpanelUser}:${cpanelPassword}`).toString('base64')

    // Construir URL da API do cPanel para enviar configurações
    // Envia as configurações do email corporativo para o email pessoal
    const baseUrl = normalizeCpanelBaseUrl(cpanelDomain)
    const apiUrl = `${baseUrl}/execute/Email/dispatch_client_settings?account=${encodeURIComponent(username)}&to=${encodeURIComponent(emailPessoal)}`

    console.log('📧 Enviando configurações de email via cPanel...')
    console.log('  → Email corporativo:', emailCorporativo)
    console.log('  → Para email pessoal:', emailPessoal)

    // Fazer requisição para o cPanel
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (data.result?.status === 1) {
      console.log(`✅ Configurações enviadas com sucesso para: ${emailPessoal}`)
      return NextResponse.json({
        success: true,
        message: 'Configurações de email enviadas com sucesso',
        emailCorporativo,
        emailPessoal
      })
    } else {
      console.error('❌ Erro ao enviar configurações:', data.result?.errors)
      return NextResponse.json({
        success: false,
        message: 'Erro ao enviar configurações de email',
        errors: data.result?.errors || ['Erro desconhecido']
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Erro na API de envio de configurações:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido'
    }, { status: 500 })
  }
}



