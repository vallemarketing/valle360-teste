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

    // Validar domínio
    if (domain !== 'valle360.com.br') {
      console.warn(`⚠️ Domínio não suportado: ${domain}. Esperado: valle360.com.br`)
      return NextResponse.json({
        success: false,
        message: `Domínio não suportado: ${domain}. Use apenas @valle360.com.br`,
        email
      }, { status: 400 })
    }

    // Criar Basic Auth
    const basicAuth = Buffer.from(`${cpanelUser}:${cpanelPassword}`).toString('base64')

    // Construir URL da API do cPanel (UAPI)
    const baseUrl = normalizeCpanelBaseUrl(cpanelDomain)
    const apiUrl = `${baseUrl}/execute/Email/add_pop?email=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&domain=${encodeURIComponent(domain)}&quota=500`

    // Fazer requisição para o cPanel
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📧 CRIAÇÃO DE EMAIL NO CPANEL`)
    console.log(`${'='.repeat(60)}`)
    console.log(`Email: ${email}`)
    console.log(`Username: ${username}`)
    console.log(`Domain: ${domain}`)
    console.log(`cPanel URL: ${baseUrl}`)
    console.log(`API Endpoint: /execute/Email/add_pop`)
    console.log(`cPanel User: ${cpanelUser}`)
    console.log(`${'='.repeat(60)}\n`)
    
    // Adicionar timeout de 30 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      console.log(`📊 Status HTTP: ${response.status}`)
      console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()))

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error(`\n${'='.repeat(60)}`)
        console.error('❌ ERRO: cPanel retornou HTML ao invés de JSON')
        console.error(`${'='.repeat(60)}`)
        console.error('Status:', response.status)
        console.error('Content-Type:', contentType)
        console.error('Primeiros 500 caracteres da resposta:')
        console.error(text.substring(0, 500))
        console.error(`${'='.repeat(60)}\n`)
        
        // Verificar se é página de login
        if (text.includes('login') || text.includes('Login') || text.includes('authentication')) {
          return NextResponse.json({
            success: false,
            message: 'Falha na autenticação com o cPanel',
            hint: 'Verifique se CPANEL_USER e CPANEL_PASSWORD estão corretos',
            details: 'O cPanel está retornando uma página de login. Credenciais inválidas ou expiradas.',
            debugInfo: {
              cpanelUrl: baseUrl,
              cpanelUser: cpanelUser,
              statusCode: response.status,
              responsePreview: text.substring(0, 200)
            }
          }, { status: 401 })
        }
        
        // Verificar se é erro 404
        if (response.status === 404 || text.includes('404') || text.includes('Not Found')) {
          return NextResponse.json({
            success: false,
            message: 'Endpoint do cPanel não encontrado',
            hint: 'Verifique se CPANEL_DOMAIN está correto (deve incluir porta :2083)',
            details: 'A URL da API do cPanel não foi encontrada. Formato esperado: https://servidor.com:2083',
            debugInfo: {
              cpanelUrl: baseUrl,
              fullUrl: apiUrl.replace(/password=[^&]+/, 'password=***'),
              statusCode: response.status
            }
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: false,
          message: 'cPanel retornou resposta inválida (HTML)',
          hint: 'Verifique CPANEL_DOMAIN, CPANEL_USER e CPANEL_PASSWORD',
          details: 'A resposta do servidor não é JSON. Isso indica URL incorreta ou problema de autenticação.',
          debugInfo: {
            cpanelUrl: baseUrl,
            statusCode: response.status,
            contentType: contentType,
            responsePreview: text.substring(0, 200)
          }
        }, { status: 500 })
      }

      const data = await response.json()
      
      console.log(`📦 Resposta do cPanel:`, JSON.stringify(data, null, 2))

      if (data.result?.status === 1 || data.status === 1) {
        console.log(`\n${'='.repeat(60)}`)
        console.log(`✅ EMAIL CRIADO COM SUCESSO`)
        console.log(`${'='.repeat(60)}`)
        console.log(`Email: ${email}`)
        console.log(`${'='.repeat(60)}\n`)
        
        return NextResponse.json({
          success: true,
          message: 'Email criado com sucesso no cPanel',
          email,
          data: data.result?.data || data.data
        })
      } else {
        const errors = data.result?.errors || data.errors || ['Erro desconhecido']
        console.error(`\n${'='.repeat(60)}`)
        console.error('❌ ERRO AO CRIAR EMAIL')
        console.error(`${'='.repeat(60)}`)
        console.error('Email:', email)
        console.error('Erros:', errors)
        console.error(`${'='.repeat(60)}\n`)
        
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
          errors,
          debugInfo: {
            email,
            domain,
            cpanelResponse: data
          }
        }, { status: 400 })
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Verificar se é timeout
      if (fetchError.name === 'AbortError') {
        console.error(`\n${'='.repeat(60)}`)
        console.error('⏱️ TIMEOUT: Requisição ao cPanel excedeu 30 segundos')
        console.error(`${'='.repeat(60)}\n`)
        
        return NextResponse.json({
          success: false,
          message: 'Timeout ao conectar com o cPanel',
          hint: 'O servidor cPanel não respondeu em 30 segundos. Verifique se a URL está correta.',
          details: 'Timeout na requisição. O servidor pode estar offline ou a URL está incorreta.',
          debugInfo: {
            cpanelUrl: baseUrl,
            timeout: '30s'
          }
        }, { status: 504 })
      }
      
      throw fetchError
    }

  } catch (error: any) {
    console.error(`\n${'='.repeat(60)}`)
    console.error('💥 ERRO GERAL NA API DE CRIAÇÃO DE EMAIL')
    console.error(`${'='.repeat(60)}`)
    console.error('Tipo:', error.name)
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    console.error(`${'='.repeat(60)}\n`)
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao criar email no cPanel',
      error: error.message || 'Erro desconhecido',
      debugInfo: {
        errorType: error.name,
        errorMessage: error.message
      }
    }, { status: 500 })
  }
}



