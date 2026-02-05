'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Send, User, Building, Phone, Mail, MapPin, FileText, Briefcase, Users as UsersIcon, DollarSign, Instagram, Facebook, Link as LinkIcon, Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
  // Dados do Cliente
  const [formData, setFormData] = useState({
    // Dados Pessoais/Empresa
    nome: '',
    nome_fantasia: '',
    razao_social: '',
    tipo_pessoa: 'juridica', // 'fisica' ou 'juridica'
    cpf_cnpj: '',
    data_nascimento: '',
    
    // Contato
    email: '',
    telefone: '',
    whatsapp: '',
    
    // Endereço da Empresa
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',

    // ========== DADOS DO SÓCIO (PJ) ==========
    socio_nome: '',
    socio_cpf: '',
    socio_email: '',
    socio_telefone: '',
    socio_estado_civil: '', // solteiro, casado, divorciado, viuvo
    socio_conjuge_nome: '',
    socio_filiacao_mae: '',
    socio_filiacao_pai: '',
    // Endereço do Sócio
    socio_cep: '',
    socio_logradouro: '',
    socio_numero: '',
    socio_complemento: '',
    socio_bairro: '',
    socio_cidade: '',
    socio_estado: '',
    
    // Profissional
    profissao: '',
    area_atuacao: '',
    site: '',
    numero_funcionarios: '',
    faturamento_estimado: '',
    
    // Redes Sociais
    instagram: '',
    facebook: '',
    tiktok: '',
    linkedin: '',
    youtube: '',
    
    // Concorrentes
    concorrentes: '',
    
    // Plano e Serviços
    plano_id: '',
    servicos_contratados: [] as string[],
    valor_mensal: '',
    dia_vencimento: '',
    data_inicio: '',
    
    // Comercial
    responsavel_comercial_id: '',
    origem_lead: '',
    observacoes: '',
    
    // Tags
    tags: [] as string[],
    
    // Logo
    logo_url: ''
  })

  const servicosDisponiveis = [
    { id: '1', nome: 'Gestão de Redes Sociais' },
    { id: '2', nome: 'Tráfego Pago' },
    { id: '3', nome: 'Criação de Conteúdo' },
    { id: '4', nome: 'Design Gráfico' },
    { id: '5', nome: 'Gestão TikTok' },
    { id: '6', nome: 'Email Marketing' },
  ]

  const planosDisponiveis = [
    { id: '1', nome: 'Básico', valor: 2500 },
    { id: '2', nome: 'Profissional', valor: 4500 },
    { id: '3', nome: 'Premium', valor: 7500 },
    { id: '4', nome: 'Enterprise', valor: 12000 },
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      servicos_contratados: prev.servicos_contratados.includes(serviceId)
        ? prev.servicos_contratados.filter(id => id !== serviceId)
        : [...prev.servicos_contratados, serviceId]
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

  const enviarBoasVindas = async (clienteId: string, email: string, senha: string) => {
    // Preparar email via mailto (API)
    const emailContent = `
      Olá ${formData.nome},
      
      É com enorme satisfação que damos as boas-vindas à Valle 360! 🚀
      
      Você está prestes a ter acesso ao portal de marketing mais avançado e inteligente 
      do Brasil, onde tecnologia e criatividade se encontram para transformar sua 
      marca em referência no mercado.
      
      🔐 Seus Dados de Acesso:
         Email: ${email}
         Senha Provisória: ${senha}
         Link: ${window.location.origin}/login
         
      ⏰ Importante: Por segurança, você será solicitado a alterar sua senha no 
      primeiro acesso.
      
      Bem-vindo à família Valle 360! 🎊
    `

    try {
      const manualResponse = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailPessoal: email,
          emailCorporativo: email,
          nome: formData.nome,
          senha,
          tipo: 'cliente',
          mode: 'manual',
        }),
      })

      const manualResult = await manualResponse.json().catch(() => null)
      if (manualResult?.mailtoUrl) {
        const win = window.open(manualResult.mailtoUrl, '_blank')
        if (!win) {
          const autoResponse = await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailPessoal: email,
              emailCorporativo: email,
              nome: formData.nome,
              senha,
              tipo: 'cliente',
              mode: 'auto',
            }),
          })
          await autoResponse.json().catch(() => null)
        }
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error)
    }

    // Registrar envio
    await supabase.from('email_logs').insert({
      recipient_email: email,
      subject: '🎉 Bem-vindo ao Valle 360!',
      content: emailContent,
      type: 'welcome_client',
      related_entity_id: clienteId
    })

    // Se tiver WhatsApp, enviar também
    if (formData.whatsapp) {
      await supabase.from('whatsapp_logs').insert({
        recipient_phone: formData.whatsapp,
        message: `🎉 Bem-vindo à Valle 360!\n\n📧 Email: ${email}\n🔑 Senha: ${senha}\n🔗 ${window.location.origin}/login`,
        type: 'welcome_client',
        related_entity_id: clienteId
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const senhaProvisoria = gerarSenhaProvisoria()
      // 1) Criar cliente via API (bypassa RLS e evita trocar a sessão do admin)
      const address = formData.cep || formData.logradouro || formData.cidade
        ? {
            cep: formData.cep,
            logradouro: formData.logradouro,
            numero: formData.numero,
            complemento: formData.complemento,
            bairro: formData.bairro,
            cidade: formData.cidade,
            estado: formData.estado,
          }
        : null

      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: senhaProvisoria,
          full_name: formData.nome,
          phone: formData.telefone,
          whatsapp: formData.whatsapp,

          company_name: formData.nome_fantasia || formData.razao_social || formData.nome,
          nome_fantasia: formData.nome_fantasia,
          razao_social: formData.razao_social,
          tipo_pessoa: formData.tipo_pessoa,
          cpf_cnpj: formData.cpf_cnpj,
          data_nascimento: formData.data_nascimento || null,
          industry: formData.area_atuacao || null,
          // Epic 11: segmento/nicho
          segment: formData.area_atuacao || null,
          website: formData.site || null,
          address,
          // Epic 11: concorrentes (texto livre + lista)
          concorrentes: formData.concorrentes || null,
          competitors: (formData.concorrentes || '')
            .split(/[\n,;]+/g)
            .map((x) => x.trim())
            .filter(Boolean),

          monthly_value: formData.valor_mensal ? parseFloat(formData.valor_mensal) : 0,
          plan_id: formData.plano_id || null,
          servicos_contratados: formData.servicos_contratados,
          dia_vencimento: formData.dia_vencimento ? parseInt(formData.dia_vencimento) : null,
          data_inicio: formData.data_inicio || null,
        })
      })

      const apiData = await res.json().catch(() => null)
      if (!res.ok) throw new Error(apiData?.error || 'Falha ao criar cliente')

      const clientData = apiData?.client
      const userId = apiData?.user_id

      // 5. Registrar log de criação
      try {
        await supabase.from('user_access_logs').insert({
          user_id: userId,
          action: 'client_created',
          action_details: {
            created_by: (await supabase.auth.getUser()).data.user?.id,
            origin: 'admin_panel'
          }
        })
      } catch {
        // best-effort
      }

      // 6. Enviar boas-vindas
      await enviarBoasVindas(clientData.id, formData.email, senhaProvisoria)

      // 7. Redirecionar
      router.push('/admin/clientes?success=cliente_criado')

    } catch (error: any) {
      console.error('Erro ao criar cliente:', error)
      toast.error('Erro ao criar cliente: ' + (error?.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold">Novo Cliente</h1>
            <p className="text-gray-600 mt-1">Cadastre um novo cliente no sistema</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 1: Dados Pessoais */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais / Empresa
              </CardTitle>
              <CardDescription>Informações básicas do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de Pessoa */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Pessoa</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="fisica"
                      checked={formData.tipo_pessoa === 'fisica'}
                      onChange={(e) => handleInputChange('tipo_pessoa', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Pessoa Física</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="juridica"
                      checked={formData.tipo_pessoa === 'juridica'}
                      onChange={(e) => handleInputChange('tipo_pessoa', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Pessoa Jurídica</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome / Razão Social */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.tipo_pessoa === 'fisica' ? 'Nome Completo *' : 'Razão Social *'}
                  </label>
                  <input
                    type="text"
                    value={formData.tipo_pessoa === 'fisica' ? formData.nome : formData.razao_social}
                    onChange={(e) => handleInputChange(
                      formData.tipo_pessoa === 'fisica' ? 'nome' : 'razao_social', 
                      e.target.value
                    )}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Nome Fantasia (apenas PJ) */}
                {formData.tipo_pessoa === 'juridica' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formData.nome_fantasia}
                      onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* CPF/CNPJ */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.tipo_pessoa === 'fisica' ? 'CPF *' : 'CNPJ *'}
                  </label>
                  <input
                    type="text"
                    value={formData.cpf_cnpj}
                    onChange={(e) => handleInputChange('cpf_cnpj', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={formData.tipo_pessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                    required
                  />
                </div>

                {/* Data de Nascimento (apenas PF) */}
                {formData.tipo_pessoa === 'fisica' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone *</label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium mb-2">WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* ========== DADOS DO SÓCIO (apenas PJ) ========== */}
              {formData.tipo_pessoa === 'juridica' && (
                <div className="pt-6 border-t space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-[#1672d6]" />
                    Dados do Sócio Responsável
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Informações necessárias para geração do contrato
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome Completo do Sócio *</label>
                      <input
                        type="text"
                        value={formData.socio_nome}
                        onChange={(e) => handleInputChange('socio_nome', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">CPF do Sócio *</label>
                      <input
                        type="text"
                        value={formData.socio_cpf}
                        onChange={(e) => handleInputChange('socio_cpf', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email do Sócio</label>
                      <input
                        type="email"
                        value={formData.socio_email}
                        onChange={(e) => handleInputChange('socio_email', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Telefone do Sócio</label>
                      <input
                        type="tel"
                        value={formData.socio_telefone}
                        onChange={(e) => handleInputChange('socio_telefone', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Estado Civil *</label>
                      <select
                        value={formData.socio_estado_civil}
                        onChange={(e) => handleInputChange('socio_estado_civil', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="solteiro">Solteiro(a)</option>
                        <option value="casado">Casado(a)</option>
                        <option value="divorciado">Divorciado(a)</option>
                        <option value="viuvo">Viúvo(a)</option>
                        <option value="uniao_estavel">União Estável</option>
                      </select>
                    </div>

                    {(formData.socio_estado_civil === 'casado' || formData.socio_estado_civil === 'uniao_estavel') && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Nome do Cônjuge</label>
                        <input
                          type="text"
                          value={formData.socio_conjuge_nome}
                          onChange={(e) => handleInputChange('socio_conjuge_nome', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Filiação - Nome da Mãe</label>
                      <input
                        type="text"
                        value={formData.socio_filiacao_mae}
                        onChange={(e) => handleInputChange('socio_filiacao_mae', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Filiação - Nome do Pai</label>
                      <input
                        type="text"
                        value={formData.socio_filiacao_pai}
                        onChange={(e) => handleInputChange('socio_filiacao_pai', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Endereço do Sócio */}
                  <div className="pt-4">
                    <h4 className="font-medium mb-3">Endereço do Sócio</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">CEP</label>
                        <input
                          type="text"
                          value={formData.socio_cep}
                          onChange={(e) => handleInputChange('socio_cep', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="00000-000"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Logradouro</label>
                        <input
                          type="text"
                          value={formData.socio_logradouro}
                          onChange={(e) => handleInputChange('socio_logradouro', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Número</label>
                        <input
                          type="text"
                          value={formData.socio_numero}
                          onChange={(e) => handleInputChange('socio_numero', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Bairro</label>
                        <input
                          type="text"
                          value={formData.socio_bairro}
                          onChange={(e) => handleInputChange('socio_bairro', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Cidade/Estado</label>
                        <input
                          type="text"
                          value={formData.socio_cidade}
                          onChange={(e) => handleInputChange('socio_cidade', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="São Paulo - SP"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-[#1672d6] text-white rounded-lg hover:bg-[#1260b5] transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Endereço e Profissional */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço e Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CEP</label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => {
                      handleInputChange('cep', e.target.value)
                      if (e.target.value.replace(/\D/g, '').length === 8) {
                        buscarCEP(e.target.value.replace(/\D/g, ''))
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Logradouro</label>
                  <input
                    type="text"
                    value={formData.logradouro}
                    onChange={(e) => handleInputChange('logradouro', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Complemento</label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => handleInputChange('complemento', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bairro</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={2}
                    placeholder="SP"
                  />
                </div>
              </div>

              {/* Informações Profissionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                <div>
                  <label className="block text-sm font-medium mb-2">Profissão / Área de Atuação</label>
                  <input
                    type="text"
                    value={formData.area_atuacao}
                    onChange={(e) => handleInputChange('area_atuacao', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: E-commerce, Restaurante, Serviços"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Site</label>
                  <input
                    type="url"
                    value={formData.site}
                    onChange={(e) => handleInputChange('site', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Número de Funcionários</label>
                  <input
                    type="number"
                    value={formData.numero_funcionarios}
                    onChange={(e) => handleInputChange('numero_funcionarios', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Faturamento Estimado (R$)</label>
                  <input
                    type="number"
                    value={formData.faturamento_estimado}
                    onChange={(e) => handleInputChange('faturamento_estimado', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Redes Sociais e Concorrentes */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="w-5 h-5" />
                Redes Sociais e Concorrência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="@usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Facebook</label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="facebook.com/pagina"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">TikTok</label>
                  <input
                    type="text"
                    value={formData.tiktok}
                    onChange={(e) => handleInputChange('tiktok', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="@usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">LinkedIn</label>
                  <input
                    type="text"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="linkedin.com/company/empresa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Principais Concorrentes
                </label>
                <textarea
                  value={formData.concorrentes}
                  onChange={(e) => handleInputChange('concorrentes', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Liste os principais concorrentes (um por linha)"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Plano e Serviços */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Plano e Serviços Contratados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plano */}
              <div>
                <label className="block text-sm font-medium mb-3">Selecione o Plano</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {planosDisponiveis.map((plano) => (
                    <button
                      key={plano.id}
                      type="button"
                      onClick={() => {
                        handleInputChange('plano_id', plano.id)
                        handleInputChange('valor_mensal', plano.valor.toString())
                      }}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        formData.plano_id === plano.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <h3 className="font-bold text-lg mb-2">{plano.nome}</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {plano.valor.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">/mês</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Serviços */}
              <div>
                <label className="block text-sm font-medium mb-3">Serviços Contratados</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {servicosDisponiveis.map((servico) => (
                    <label
                      key={servico.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.servicos_contratados.includes(servico.id)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.servicos_contratados.includes(servico.id)}
                        onChange={() => handleServiceToggle(servico.id)}
                        className="w-5 h-5"
                      />
                      <span className="font-medium">{servico.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dados do Contrato */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                <div>
                  <label className="block text-sm font-medium mb-2">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    value={formData.valor_mensal}
                    onChange={(e) => handleInputChange('valor_mensal', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento}
                    onChange={(e) => handleInputChange('dia_vencimento', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Data de Início</label>
                  <input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Criar Cliente e Enviar Acesso
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}

