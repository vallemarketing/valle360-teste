#!/usr/bin/env node

/**
 * Script de Teste - Conexão cPanel
 * 
 * Este script testa a conexão com o cPanel e valida as credenciais
 * antes de tentar criar emails via sistema.
 * 
 * Uso: node scripts/test-cpanel-connection.js
 */

require('dotenv').config({ path: '.env.local' })

const CPANEL_DOMAIN = process.env.CPANEL_DOMAIN
const CPANEL_USER = process.env.CPANEL_USER
const CPANEL_PASSWORD = process.env.CPANEL_PASSWORD

console.log('\n' + '='.repeat(70))
console.log('🧪 TESTE DE CONEXÃO COM CPANEL')
console.log('='.repeat(70) + '\n')

// Validar variáveis de ambiente
console.log('📋 Verificando variáveis de ambiente...\n')

if (!CPANEL_DOMAIN) {
  console.error('❌ CPANEL_DOMAIN não configurado no .env.local')
  process.exit(1)
}

if (!CPANEL_USER) {
  console.error('❌ CPANEL_USER não configurado no .env.local')
  process.exit(1)
}

if (!CPANEL_PASSWORD) {
  console.error('❌ CPANEL_PASSWORD não configurado no .env.local')
  process.exit(1)
}

console.log('✅ CPANEL_DOMAIN:', CPANEL_DOMAIN)
console.log('✅ CPANEL_USER:', CPANEL_USER)
console.log('✅ CPANEL_PASSWORD:', '*'.repeat(CPANEL_PASSWORD.length))
console.log('')

// Normalizar URL
function normalizeCpanelBaseUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withScheme.replace(/\/+$/, '')
}

const baseUrl = normalizeCpanelBaseUrl(CPANEL_DOMAIN)
console.log('🔗 URL normalizada:', baseUrl)
console.log('')

// Teste 1: Verificar se o servidor responde
console.log('='.repeat(70))
console.log('TESTE 1: Verificar se o servidor cPanel responde')
console.log('='.repeat(70) + '\n')

async function testServerConnection() {
  try {
    console.log(`📡 Tentando conectar em: ${baseUrl}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    console.log(`✅ Servidor respondeu com status: ${response.status}`)
    return true
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout: Servidor não respondeu em 10 segundos')
    } else {
      console.error('❌ Erro ao conectar:', error.message)
    }
    return false
  }
}

// Teste 2: Testar autenticação
console.log('\n' + '='.repeat(70))
console.log('TESTE 2: Testar autenticação no cPanel')
console.log('='.repeat(70) + '\n')

async function testAuthentication() {
  try {
    const basicAuth = Buffer.from(`${CPANEL_USER}:${CPANEL_PASSWORD}`).toString('base64')
    const testUrl = `${baseUrl}/json-api/cpanel`
    
    console.log(`🔐 Testando autenticação em: ${testUrl}`)
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`
      }
    })
    
    console.log(`📊 Status: ${response.status}`)
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`)
    
    if (response.status === 200) {
      console.log('✅ Autenticação bem-sucedida!')
      return true
    } else if (response.status === 401) {
      console.error('❌ Autenticação falhou: Credenciais inválidas')
      return false
    } else {
      console.warn(`⚠️  Status inesperado: ${response.status}`)
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao testar autenticação:', error.message)
    return false
  }
}

// Teste 3: Testar API de Email
console.log('\n' + '='.repeat(70))
console.log('TESTE 3: Testar API de criação de email')
console.log('='.repeat(70) + '\n')

async function testEmailAPI() {
  try {
    const basicAuth = Buffer.from(`${CPANEL_USER}:${CPANEL_PASSWORD}`).toString('base64')
    
    // Usar email de teste
    const testEmail = 'teste-cpanel-api'
    const testPassword = 'TesteSenha123!'
    const testDomain = 'valle360.com.br'
    
    const apiUrl = `${baseUrl}/execute/Email/add_pop?email=${encodeURIComponent(testEmail)}&password=${encodeURIComponent(testPassword)}&domain=${encodeURIComponent(testDomain)}&quota=500`
    
    console.log(`📧 Testando criação de email: ${testEmail}@${testDomain}`)
    console.log(`🔗 Endpoint: /execute/Email/add_pop`)
    console.log('')
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Status: ${response.status}`)
    
    const contentType = response.headers.get('content-type')
    console.log(`📋 Content-Type: ${contentType}`)
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('\n❌ Resposta não é JSON!')
      console.error('Primeiros 300 caracteres:')
      console.error(text.substring(0, 300))
      
      if (text.includes('login') || text.includes('Login')) {
        console.error('\n🔴 O cPanel retornou página de login')
        console.error('Isso indica que a autenticação falhou ou a URL está incorreta')
      }
      
      return false
    }
    
    const data = await response.json()
    console.log('\n📦 Resposta JSON:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.result?.status === 1 || data.status === 1) {
      console.log('\n✅ API de email funcionando!')
      console.log(`ℹ️  Email de teste criado: ${testEmail}@${testDomain}`)
      console.log('⚠️  Lembre-se de deletar este email de teste no cPanel')
      return true
    } else {
      const errors = data.result?.errors || data.errors || []
      
      // Verificar se já existe
      const alreadyExists = errors.some(e => 
        e.toLowerCase().includes('already exists') || 
        e.toLowerCase().includes('já existe')
      )
      
      if (alreadyExists) {
        console.log('\n✅ API funcionando (email já existe)')
        return true
      }
      
      console.error('\n❌ Erro ao criar email:')
      console.error(errors.join('\n'))
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message)
    return false
  }
}

// Executar testes
async function runTests() {
  const test1 = await testServerConnection()
  
  if (!test1) {
    console.log('\n' + '='.repeat(70))
    console.log('🔴 FALHA: Servidor cPanel não responde')
    console.log('='.repeat(70))
    console.log('\nVerifique:')
    console.log('1. A URL está correta? (deve incluir https:// e porta :2083)')
    console.log('2. O servidor está online?')
    console.log('3. Há firewall bloqueando?')
    process.exit(1)
  }
  
  const test2 = await testAuthentication()
  
  if (!test2) {
    console.log('\n' + '='.repeat(70))
    console.log('🔴 FALHA: Autenticação no cPanel')
    console.log('='.repeat(70))
    console.log('\nVerifique:')
    console.log('1. CPANEL_USER está correto?')
    console.log('2. CPANEL_PASSWORD está correto?')
    console.log('3. O usuário tem permissões de API?')
    process.exit(1)
  }
  
  const test3 = await testEmailAPI()
  
  console.log('\n' + '='.repeat(70))
  console.log('RESULTADO FINAL')
  console.log('='.repeat(70) + '\n')
  
  if (test1 && test2 && test3) {
    console.log('✅ SUCESSO: Integração com cPanel funcionando!')
    console.log('\nVocê pode criar colaboradores no sistema.')
    console.log('Os emails serão criados automaticamente no cPanel.')
  } else {
    console.log('❌ FALHA: Integração com cPanel NÃO está funcionando')
    console.log('\nConsulte o arquivo TROUBLESHOOTING_CPANEL.md para mais informações.')
  }
  
  console.log('\n' + '='.repeat(70) + '\n')
}

runTests().catch(console.error)
