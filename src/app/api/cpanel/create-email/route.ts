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

    // Somente admin (provisionamento de mailbox)
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin')
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
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

    // Credenciais do cPanel (configurar no .env.local)
    const cpanelUser = process.env.CPANEL_USER
    const cpanelPassword = process.env.CPANEL_PASSWORD
    const cpanelDomain = process.env.CPANEL_DOMAIN

    if (!cpanelUser || !cpanelPassword || !cpanelDomain) {
      console.warn('⚠️ Credenciais do cPanel não configuradas')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Credenciais do cPanel não configuradas. Configure CPANEL_USER, CPANEL_PASSWORD e CPANEL_DOMAIN (ex.: https://SEU_HOST:2083).',
          email 
        },
        { status: 200 }
      )
    }

    // Criar Basic Auth
    const basicAuth = Buffer.from(`${cpanelUser}:${cpanelPassword}`).toString('base64')

    // Construir URL da API do cPanel (UAPI)
    const baseUrl = normalizeCpanelBaseUrl(cpanelDomain)
    const apiUrl = `${baseUrl}/execute/Email/add_pop?email=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&domain=${encodeURIComponent(domain)}&quota=500`

    // Fazer requisição para o cPanel
    console.log(`📧 Tentando criar email no cPanel: ${email}`)
    console.log(`🔗 URL: ${apiUrl.replace(/password=[^&]+/, 'password=***')}`)
    
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
      console.error('❌ cPanel retornou HTML ao invés de JSON:', text.substring(0, 300))
      return NextResponse.json({
        success: false,
        message: 'cPanel retornou resposta inválida (HTML). Verifique a configuração.',
        hint: 'CPANEL_DOMAIN deve ser a URL completa com porta, ex: https://seu-servidor.com:2083',
        details: 'A resposta do servidor não é JSON. Isso pode indicar URL incorreta ou problema de autenticação.',
        email
      }, { status: 500 })
    }

    const data = await response.json()

    if (data.result?.status === 1 || data.status === 1) {
      console.log(`✅ Email criado no cPanel: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Email criado com sucesso no cPanel',
        email,
        data: data.result?.data || data.data
      })
    } else {
      const errors = data.result?.errors || data.errors || ['Erro desconhecido']
      console.error('❌ Erro ao criar email no cPanel:', errors)
      
      // Verificar se é erro de email já existente
      const emailExists = errors.some((e: string) => 
        e.toLowerCase().includes('already exists') || 
        e.toLowerCase().includes('já existe')
      )
      
      if (emailExists) {
        console.log(`ℹ️ Email já existe no cPanel: ${email}`)
        return NextResponse.json({
          success: true,
          message: 'Email já existe no cPanel',
          email,
          alreadyExists: true
        })
      }
      
      return NextResponse.json({
        success: false,
        message: 'Erro ao criar email no cPanel',
        errors
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Erro na API de criação de email:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido'
    }, { status: 500 })
  }
}



