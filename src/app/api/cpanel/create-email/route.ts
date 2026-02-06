import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateCPanelPassword, validatePasswordStrength } from '@/lib/passwordGenerator'

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

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(password);
    let finalPassword = password;
    let passwordWasGenerated = false;

    if (!passwordValidation.isValid) {
      console.log(`⚠️ Senha fornecida é fraca (rating: ${passwordValidation.rating}/100)`);
      console.log(`⚠️ Erros: ${passwordValidation.errors.join(', ')}`);
      console.log(`🔐 Gerando senha forte automaticamente...`);
      
      finalPassword = generateCPanelPassword();
      passwordWasGenerated = true;
      
      const newValidation = validatePasswordStrength(finalPassword);
      console.log(`✅ Nova senha gerada (rating: ${newValidation.rating}/100)`);
    }

    // Extrair username e domain do email
    const [username, domain] = email.split('@')
    if (!username || !domain) {
      return NextResponse.json(
        { success: false, message: 'Email inválido (formato esperado: usuario@dominio)' },
        { status: 400 }
      )
    }

    // Sanitizar username: remover pontos e caracteres especiais (cPanel não aceita)
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '')
    const sanitizedEmail = `${sanitizedUsername}@${domain}`

    console.log(`📧 Email original: ${email}`)
    console.log(`📧 Email sanitizado: ${sanitizedEmail}`)
    console.log(`👤 Username: ${sanitizedUsername}`)
    console.log(`🌐 Domain: ${domain}`)

    // Validar domínio
    if (domain !== 'valle360.com.br') {
      console.warn(`⚠️ Domínio não suportado: ${domain}. Esperado: valle360.com.br`)
      return NextResponse.json({
        success: false,
        message: `Domínio não suportado: ${domain}. Use apenas @valle360.com.br`,
        email
      }, { status: 400 })
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

    // Construir URL e body da API do cPanel (UAPI)
    // Documentação oficial: POST com form data, email = username (SEM @domain), domain separado
    // Ref: https://api.docs.cpanel.net/openapi/cpanel/operation/add_pop
    const baseUrl = normalizeCpanelBaseUrl(cpanelDomain)
    const apiUrl = `${baseUrl}/execute/Email/add_pop`
    
    // Parâmetros como form data (POST body, NÃO query string)
    const formParams = new URLSearchParams({
      email: sanitizedUsername,
      password: finalPassword,
      domain: domain,
      quota: '500',
      skip_update_db: '1'
    })

    // Fazer requisição para o cPanel
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📧 CRIAÇÃO DE EMAIL NO CPANEL`)
    console.log(`${'='.repeat(60)}`)
    console.log(`Email a criar: ${sanitizedEmail}`)
    console.log(`Username (param email): ${sanitizedUsername}`)
    console.log(`Domain (param domain): ${domain}`)
    console.log(`cPanel URL: ${baseUrl}`)
    console.log(`API Endpoint: POST /execute/Email/add_pop`)
    console.log(`cPanel User: ${cpanelUser}`)
    console.log(`Form params: email=${sanitizedUsername}&domain=${domain}&quota=500&skip_update_db=1`)
    console.log(`${'='.repeat(60)}\n`)
    
    // Adicionar timeout de 30 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formParams.toString(),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      console.log(`📊 Status HTTP: ${response.status}`)
      console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()))

      // Ler resposta como texto primeiro (cPanel pode retornar JSON com content-type text/plain)
      const responseText = await response.text()
      console.log(`📦 Resposta bruta:`, responseText.substring(0, 500))
      
      // Tentar parsear como JSON independente do content-type
      let data: any
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error(`\n${'='.repeat(60)}`)
        console.error('❌ ERRO: cPanel retornou resposta não-JSON')
        console.error(`${'='.repeat(60)}`)
        console.error('Resposta:', responseText.substring(0, 500))
        console.error(`${'='.repeat(60)}\n`)
        
        // Verificar se é página de login
        if (responseText.includes('login') || responseText.includes('Login') || responseText.includes('authentication')) {
          return NextResponse.json({
            success: false,
            message: 'Falha na autenticação com o cPanel',
            hint: 'Verifique se CPANEL_USER e CPANEL_PASSWORD estão corretos',
            debugInfo: { cpanelUrl: baseUrl, cpanelUser, statusCode: response.status }
          }, { status: 401 })
        }
        
        return NextResponse.json({
          success: false,
          message: 'cPanel retornou resposta inválida',
          hint: 'Verifique CPANEL_DOMAIN, CPANEL_USER e CPANEL_PASSWORD',
          debugInfo: {
            cpanelUrl: baseUrl,
            statusCode: response.status,
            contentType: response.headers.get('content-type'),
            responsePreview: responseText.substring(0, 300)
          }
        }, { status: 500 })
      }
      
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
          email: sanitizedEmail,
          originalEmail: email,
          passwordGenerated: passwordWasGenerated,
          generatedPassword: passwordWasGenerated ? finalPassword : undefined,
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



