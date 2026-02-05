'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Send, User, Mail, Phone, MapPin, Briefcase, Shield, Calendar, DollarSign, Building } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CredentialsModal } from '@/components/admin/CredentialsModal'

export default function NovoColaboradorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailGerado, setEmailGerado] = useState('')
  const [emailConflito, setEmailConflito] = useState(false)
  const [emailModoManual, setEmailModoManual] = useState(false)
  
  // Estado para modal de credenciais
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [credenciaisInfo, setCredenciaisInfo] = useState<{
    email: string
    senha: string
    nome: string
    emailEnviado: boolean
    provider?: string
    mailtoUrl?: string
  } | null>(null)
  
  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: '',
    sobrenome: '',
    email: '', // Email corporativo - gerado automaticamente
    email_pessoal: '', // Email pessoal para receber credenciais
    telefone: '',
    whatsapp: '',
    cpf: '',
    data_nascimento: '',
    
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    
    // Dados Bancários (PIX)
    tipo_pix: 'cpf', // cpf, email, telefone, chave_aleatoria
    chave_pix: '',
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente', // corrente, poupanca
    
    // Profissional
    areas_atuacao: [] as string[],
    nivel_hierarquico: 'junior', // junior, pleno, senior, lider
    gestor_direto_id: '',
    horario_trabalho: 'integral', // integral, meio_periodo, flexivel
    salario: '',
    
    // Contato de Emergência
    contato_emergencia_nome: '',
    contato_emergencia_telefone: '',
    contato_emergencia_parentesco: '',
    
    // Foto
    foto_url: ''
  })

  const areasDisponiveis = [
    { id: 'comercial', nome: 'Comercial', icon: '💼' },
    { id: 'trafego_pago', nome: 'Tráfego Pago', icon: '📊' },
    { id: 'designer_grafico', nome: 'Designer Gráfico', icon: '🎨' },
    { id: 'web_designer', nome: 'Web Designer', icon: '💻' },
    { id: 'head_marketing', nome: 'Head de Marketing', icon: '🎯' },
    { id: 'rh', nome: 'RH', icon: '👥' },
    { id: 'financeiro', nome: 'Financeiro', icon: '💰' },
    { id: 'social_media', nome: 'Social Media', icon: '📱' },
    { id: 'videomaker', nome: 'Videomaker', icon: '🎥' },
  ]

  // Gerar email automaticamente (apenas no modo automático)
  useEffect(() => {
    if (!emailModoManual && formData.nome && formData.sobrenome) {
      const emailBase = `${formData.nome.toLowerCase().trim()}.${formData.sobrenome.toLowerCase().trim()}@valle360.com.br`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9.@]/g, '') // Remove caracteres especiais
      
      setEmailGerado(emailBase)
      handleInputChange('email', emailBase)
      verificarEmailDisponivel(emailBase)
    }
  }, [formData.nome, formData.sobrenome, emailModoManual])

  const verificarEmailDisponivel = async (email: string) => {
    if (email) {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      
      setEmailConflito(!!data)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAreaToggle = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      areas_atuacao: prev.areas_atuacao.includes(areaId)
        ? prev.areas_atuacao.filter(id => id !== areaId)
        : [...prev.areas_atuacao, areaId]
    }))
  }

  const buscarCEP = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          handleInputChange('logradouro', data.logradouro)
          handleInputChange('bairro', data.bairro)
          handleInputChange('cidade', data.localidade)
          handleInputChange('estado', data.uf)
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }

  const gerarSenhaProvisoria = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$'
    let senha = 'Valle@'
    for (let i = 0; i < 6; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return senha
  }

  const definirPermissoesPorArea = (areas: string[]) => {
    const permissoes: any = {
      can_view_dashboard: true,
      can_view_kanban: true,
      can_view_clients: false,
      can_view_financial: false,
      can_view_reports: false,
    }

    areas.forEach(area => {
      switch(area) {
        case 'comercial':
          permissoes.can_view_clients = true
          permissoes.can_edit_clients = true
          break
        case 'head_marketing':
          permissoes.can_view_clients = true
          permissoes.can_view_reports = true
          permissoes.can_approve_content = true
          break
        case 'financeiro':
          permissoes.can_view_financial = true
          permissoes.can_view_reports = true
          break
        case 'rh':
          permissoes.can_view_financial = true
          permissoes.can_view_reports = true
          break
      }
    })

    return permissoes
  }

  const enviarBoasVindas = async (colaboradorId: string, emailCorporativo: string, emailPessoal: string, senha: string, areas: string[]) => {
    const areasTexto = areas.map(a => areasDisponiveis.find(area => area.id === a)?.nome).join(', ')

    const emailContent = `
      Olá ${formData.nome},
      
      É com o coração cheio de alegria que damos as BOAS-VINDAS à família Valle 360! 🎊
      
      Hoje marca o início de uma parceria que promete ser repleta de conquistas, 
      aprendizado e muito sucesso! Acreditamos que juntos, vamos construir algo 
      verdadeiramente extraordinário.
      
      💼 Você fará parte do time de: ${areasTexto}
      
      Na Valle 360, não somos apenas colegas de trabalho - somos uma família que se 
      apoia, cresce junta e celebra cada vitória como se fosse a primeira! 🌟
      
      🔐 Seus Dados de Acesso ao Sistema Valle 360:
         Email corporativo: ${emailCorporativo}
         Senha Provisória: ${senha}
         Link de Acesso: ${window.location.origin}/login
         
      ⚠️ IMPORTANTE: Altere sua senha no primeiro acesso!
         
      Bem-vindo à família Valle 360! 🚀
    `

    // Enviar email para o email PESSOAL do colaborador
    let emailEnviado = false
    let emailProvider = ''
    let fallbackCredentials = {
      emailCorporativo,
      emailPessoal,
      senha,
      mailtoUrl: '',
    }
    
    try {
      console.log('📤 Tentando enviar email de boas-vindas...')
      
      // Tentar envio automático direto via webhook
      const autoResponse = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailPessoal,
          emailCorporativo,
          nome: formData.nome,
          senha,
          areasTexto,
          tipo: 'colaborador',
          mode: 'auto',
        })
      })
      
      const autoResult = await autoResponse.json().catch(() => null)
      console.log('📧 Resposta do envio automático:', autoResult)
      
      if (autoResult?.success) {
        emailEnviado = true
        emailProvider = autoResult.provider || 'webhook'
        console.log(`✅ Email enviado com sucesso via ${emailProvider}`)
      } else {
        console.log('⚠️ Envio automático falhou, preparando fallback')
        
        // Criar mailto URL para fallback
        const subject = '🎉 Bem-vindo à Família Valle 360!'
        const body = `Olá ${formData.nome},\n\n🔐 Seus Dados de Acesso:\n   📧 Email: ${emailCorporativo}\n   🔑 Senha: ${senha}\n   🔗 ${window.location.origin}/login\n\n⚠️ Altere sua senha no primeiro acesso!`
        const mailtoUrl = `mailto:${emailPessoal}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        
        fallbackCredentials = {
          emailCorporativo,
          emailPessoal,
          senha,
          mailtoUrl,
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error)
    }
    
    // Sempre retornar credenciais para fallback
    return { 
      emailEnviado, 
      emailProvider, 
      fallbackCredentials 
    }

    // Registrar envio no log (opcional - não bloqueia se falhar)
    try {
      await supabase.from('email_logs').insert({
        recipient_email: emailPessoal,
        subject: '🎉 Bem-vindo à Família Valle 360! Seus Dados de Acesso 🚀',
        content: emailContent,
        type: 'welcome_employee',
        related_entity_id: colaboradorId
      })
    } catch (error) {
      console.log('Log de email não registrado')
    }

    // Enviar via WhatsApp (opcional)
    if (formData.whatsapp) {
      try {
        await supabase.from('whatsapp_logs').insert({
          recipient_phone: formData.whatsapp,
          message: `🎉 Bem-vindo à Valle 360!\n\n💼 Área: ${areasTexto}\n📧 Email Corporativo: ${emailCorporativo}\n🔑 Senha: ${senha}\n🔗 ${window.location.origin}/login\n\n⚠️ Altere sua senha no primeiro acesso!`,
          type: 'welcome_employee',
          related_entity_id: colaboradorId
        })
      } catch (error) {
        console.log('Log de WhatsApp não registrado')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (emailConflito) {
      toast.error('Este email já está em uso. Por favor, escolha outro email manualmente.')
      return
    }

    setLoading(true)

    try {
      const senhaProvisoria = gerarSenhaProvisoria()
      let mailboxCreated = false
      let mailboxWarning: string | null = null
      
      // 1. Criar colaborador via API (bypassa RLS e rate limiting)
      const response = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          sobrenome: formData.sobrenome,
          email: formData.email,
          emailPessoal: formData.email_pessoal,
          telefone: formData.telefone,
          senha: senhaProvisoria,
          areas: formData.areas_atuacao,
          dataNascimento: formData.data_nascimento,
          contatoEmergencia: formData.contato_emergencia_nome,
          telefoneEmergencia: formData.contato_emergencia_telefone,
          chavePix: formData.chave_pix,
          fotoUrl: formData.foto_url,
          nivelHierarquico: formData.nivel_hierarquico
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar colaborador')
      }

      console.log('✅ Colaborador criado:', result)

      // 2. Criar email na hospedagem via cPanel API
      try {
        const cpanelResponse = await fetch('/api/cpanel/create-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: senhaProvisoria
          })
        })

        console.log("CPNAEL TESTE", cpanelResponse)

        const cpanelJson = await cpanelResponse.json().catch(() => null)
        mailboxCreated = Boolean(cpanelResponse.ok && cpanelJson?.success === true)

        if (mailboxCreated) {
          console.log('✅ Email corporativo criado no cPanel')

          // 2.1. Enviar configurações de email para o email pessoal via cPanel (best-effort)
          try {
            const settingsResp = await fetch('/api/cpanel/send-email-settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                emailCorporativo: formData.email,
                emailPessoal: formData.email_pessoal
              })
            })
            const settingsJson = await settingsResp.json().catch(() => null)
            const settingsOk = Boolean(settingsResp.ok && settingsJson?.success === true)
            if (settingsOk) {
              console.log('✅ Configurações de email enviadas via cPanel')
            } else {
              console.warn('⚠️ Configurações de email não enviadas via cPanel:', settingsJson?.message || settingsJson?.error || 'Falha')
            }
          } catch (settingsError) {
            console.error('⚠️ Configurações de email não enviadas:', settingsError)
          }
        } else {
          mailboxWarning = String(cpanelJson?.message || cpanelJson?.error || (cpanelResponse.ok ? 'Email não criado no cPanel' : 'Erro ao criar email no cPanel'))
          console.warn('⚠️ Email corporativo NÃO foi criado no cPanel:', mailboxWarning)
        }
      } catch (cpanelError) {
        console.error('⚠️ Email não criado no cPanel:', cpanelError)
        mailboxWarning = (cpanelError as any)?.message || 'Falha ao chamar cPanel'
        // Não bloqueia o cadastro se falhar
      }

      // 3. Enviar boas-vindas para o EMAIL PESSOAL
      const emailResult = await enviarBoasVindas(result.employeeId, formData.email, formData.email_pessoal, senhaProvisoria, formData.areas_atuacao)

      // 4. Mostrar mensagem de sucesso
      toast.success('Colaborador criado com sucesso!');
      
      if (mailboxCreated) {
        toast.success('Mailbox criada no cPanel.');
      } else {
        toast.warning(
          mailboxWarning
            ? `Mailbox (cPanel) não criada automaticamente: ${mailboxWarning}`
            : 'Mailbox (cPanel) não criada automaticamente.'
        );
      }

      // 5. Verificar resultado do email
      console.log('📧 Resultado do envio de email:', emailResult)
      
      if (emailResult?.emailEnviado) {
        toast.success(`✅ Credenciais enviadas para: ${formData.email_pessoal}`);
        // Mostrar modal mesmo quando email foi enviado (para ter backup das credenciais)
        setCredenciaisInfo({
          email: formData.email,
          senha: senhaProvisoria,
          nome: formData.nome,
          emailEnviado: true,
          provider: emailResult?.emailProvider,
        })
        setShowCredentialsModal(true)
      } else {
        // Email não foi enviado - SEMPRE mostrar modal com credenciais
        const fallback = emailResult?.fallbackCredentials
        console.log('⚠️ Email não foi enviado. Mostrando modal de fallback:', fallback)
        
        setCredenciaisInfo({
          email: fallback?.emailCorporativo || formData.email,
          senha: fallback?.senha || senhaProvisoria,
          nome: formData.nome,
          emailEnviado: false,
          mailtoUrl: fallback?.mailtoUrl,
        })
        setShowCredentialsModal(true)
        toast.error('❌ Email não foi enviado automaticamente. COPIE as credenciais do modal!')
      }

    } catch (error: any) {
      console.error('Erro ao criar colaborador:', error)
      toast.error('Erro ao criar colaborador: ' + (error?.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Novo Colaborador</h1>
            <p className="text-gray-600 mt-1">Cadastre um novo membro da equipe</p>
            <p className="text-sm mt-2 text-amber-700">
              Atenção: esta tela cria um usuário NOVO no Supabase Auth. Se o colaborador já existe (login/senha), use{' '}
              <Link className="underline" href="/admin/colaboradores/vincular">
                Vincular existente
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sobrenome *</label>
                <input
                  type="text"
                  value={formData.sobrenome}
                  onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Email Corporativo - Automático ou Manual */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Email Corporativo
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {emailModoManual ? 'Manual' : 'Automático'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailModoManual(!emailModoManual)
                      if (!emailModoManual) {
                        // Limpando para digitar manualmente
                        setEmailGerado('')
                        handleInputChange('email', '')
                      }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      emailModoManual ? 'bg-[#1672d6]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        emailModoManual ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {emailModoManual ? (
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange('email', e.target.value)
                      verificarEmailDisponivel(e.target.value)
                    }}
                    placeholder="Digite o email existente (ex: joao@valle360.com.br)"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1672d6] ${
                      emailConflito ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 flex-1">
                      {emailGerado || 'Preencha nome e sobrenome para gerar'}
                    </span>
                  </div>
                </div>
              )}
              
              {emailConflito && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  ⚠️ Este email já está em uso no sistema
                </p>
              )}
              
              <p className="text-xs text-gray-500">
                {emailModoManual 
                  ? '💡 Use para colaboradores que já possuem email @valle360.com.br'
                  : '💡 O email será gerado: nome.sobrenome@valle360.com.br'
                }
              </p>
            </div>

            {/* Email Pessoal para Receber Credenciais */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Email Pessoal (Para Receber Login e Senha) *
              </label>
              <input
                type="email"
                value={formData.email_pessoal}
                onChange={(e) => handleInputChange('email_pessoal', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="email.pessoal@gmail.com"
                required
              />
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Send className="w-3 h-3" />
                As credenciais de acesso serão enviadas para este email
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CPF *</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data de Nascimento</label>
                <input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telefone *</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Áreas de Atuação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Áreas de Atuação *
            </CardTitle>
            <CardDescription>Selecione uma ou mais áreas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {areasDisponiveis.map((area) => (
                <label
                  key={area.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.areas_atuacao.includes(area.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.areas_atuacao.includes(area.id)}
                    onChange={() => handleAreaToggle(area.id)}
                    className="w-5 h-5"
                  />
                  <span className="text-2xl">{area.icon}</span>
                  <span className="font-medium text-sm">{area.nome}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dados Bancários (PIX) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Dados Bancários e PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Chave PIX</label>
                <select
                  value={formData.tipo_pix}
                  onChange={(e) => handleInputChange('tipo_pix', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cpf">CPF</option>
                  <option value="email">Email</option>
                  <option value="telefone">Telefone</option>
                  <option value="chave_aleatoria">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Chave PIX</label>
                <input
                  type="text"
                  value={formData.chave_pix}
                  onChange={(e) => handleInputChange('chave_pix', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Banco</label>
                <input
                  type="text"
                  value={formData.banco}
                  onChange={(e) => handleInputChange('banco', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Nubank, Banco do Brasil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Agência</label>
                <input
                  type="text"
                  value={formData.agencia}
                  onChange={(e) => handleInputChange('agencia', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Conta</label>
                <input
                  type="text"
                  value={formData.conta}
                  onChange={(e) => handleInputChange('conta', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Conta</label>
                <select
                  value={formData.tipo_conta}
                  onChange={(e) => handleInputChange('tipo_conta', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Conta Poupança</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Administrativas (Somente Admin Vê) */}
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <Shield className="w-5 h-5" />
              Informações Administrativas (Visível Apenas para Você)
            </CardTitle>
            <CardDescription className="text-yellow-800">
              Estas informações são confidenciais e não serão visíveis para o colaborador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nível Hierárquico</label>
                <select
                  value={formData.nivel_hierarquico}
                  onChange={(e) => handleInputChange('nivel_hierarquico', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="junior">Júnior</option>
                  <option value="pleno">Pleno</option>
                  <option value="senior">Sênior</option>
                  <option value="lider">Líder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Salário (R$)</label>
                <input
                  type="number"
                  value={formData.salario}
                  onChange={(e) => handleInputChange('salario', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Horário de Trabalho</label>
                <select
                  value={formData.horario_trabalho}
                  onChange={(e) => handleInputChange('horario_trabalho', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="integral">Integral</option>
                  <option value="meio_periodo">Meio Período</option>
                  <option value="flexivel">Flexível</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-yellow-800">
              📌 A data de admissão será registrada automaticamente no primeiro login do colaborador
            </p>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || emailConflito}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Criando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Criar Colaborador e Enviar Acesso
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Modal de Credenciais - exibe quando email não foi enviado */}
      {credenciaisInfo && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => {
            setShowCredentialsModal(false)
            // Redirecionar após fechar o modal
            router.push('/admin/colaboradores?success=colaborador_criado')
          }}
          credentials={{
            email: credenciaisInfo.email,
            senha: credenciaisInfo.senha,
            webmailUrl: 'https://webmail.vallegroup.com.br/',
            loginUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
            mailtoUrl: credenciaisInfo.mailtoUrl,
          }}
          nome={credenciaisInfo.nome}
          tipo="colaborador"
          emailEnviado={credenciaisInfo.emailEnviado}
          provider={credenciaisInfo.provider}
        />
      )}
    </div>
  )
}

