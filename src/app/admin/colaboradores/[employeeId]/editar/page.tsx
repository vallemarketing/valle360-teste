'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, User, Mail, Phone, Briefcase, Shield, DollarSign, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function EditarColaboradorPage() {
  const params = useParams<{ employeeId: string }>()
  const employeeId = params?.employeeId
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employee, setEmployee] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    email_pessoal: '',
    telefone: '',
    whatsapp: '',
    cpf: '',
    data_nascimento: '',
    areas_atuacao: [] as string[],
    nivel_hierarquico: 'junior',
    salario: '',
    horario_trabalho: 'integral',
    chave_pix: '',
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente',
    tipo_pix: 'cpf',
    contato_emergencia_nome: '',
    contato_emergencia_telefone: '',
    contato_emergencia_parentesco: '',
    foto_url: '',
    nova_senha: '',
    is_active: true,
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

  useEffect(() => {
    if (employeeId) {
      loadEmployee()
    }
  }, [employeeId])

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const loadEmployee = async () => {
    try {
      if (!employeeId) {
        toast.error('Colaborador inválido')
        router.push('/admin/colaboradores')
        return
      }

      const authHeaders = await getAuthHeaders()
      const res = await fetch(`/api/admin/employees/${employeeId}`, { headers: authHeaders })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar colaborador')

      const emp = data?.employee || {}
      const user = data?.user || {}
      const profile = data?.profile || {}

      setEmployee(emp)

      const fullName =
        profile.full_name ||
        user.full_name ||
        user.name ||
        emp.full_name ||
        `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
      const nameParts = fullName.split(' ')
      const nome = nameParts[0] || ''
      const sobrenome = nameParts.slice(1).join(' ') || ''

      setFormData({
        nome,
        sobrenome,
        email: user.email || emp.email || '',
        email_pessoal: emp.personal_email || profile?.metadata?.personal_email || '',
        telefone: profile.phone || user.phone || emp.phone || '',
        whatsapp: emp.whatsapp || '',
        cpf: emp.cpf || '',
        data_nascimento: emp.birth_date || '',
        areas_atuacao: emp.areas || [],
        nivel_hierarquico: emp.hierarchy_level || 'junior',
        salario: emp.salary?.toString() || '',
        horario_trabalho: emp.work_schedule || 'integral',
        chave_pix: emp.pix_key || '',
        banco: emp.bank_name || '',
        agencia: emp.bank_agency || '',
        conta: emp.bank_account || '',
        tipo_conta: emp.bank_account_type || 'corrente',
        tipo_pix: emp.pix_type || 'cpf',
        contato_emergencia_nome: emp.emergency_contact_name || '',
        contato_emergencia_telefone: emp.emergency_contact_phone || '',
        contato_emergencia_parentesco: emp.emergency_contact_relation || '',
        foto_url: profile.avatar_url || '',
        nova_senha: '',
        is_active: emp.is_active !== false,
      })
    } catch (error: any) {
      console.error('Erro ao carregar colaborador:', error)
      toast.error(error?.message || 'Erro ao carregar dados do colaborador')
    } finally {
      setLoading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const fullName = `${formData.nome} ${formData.sobrenome}`.trim()

      if (!employeeId) throw new Error('Colaborador inválido')

      const authHeaders = await getAuthHeaders()
      const payload = {
        first_name: formData.nome,
        last_name: formData.sobrenome,
        full_name: fullName,
        personal_email: formData.email_pessoal,
        phone: formData.telefone,
        whatsapp: formData.whatsapp,
        cpf: formData.cpf,
        birth_date: formData.data_nascimento || null,
        areas: formData.areas_atuacao,
        hierarchy_level: formData.nivel_hierarquico,
        salary: formData.salario ? parseFloat(formData.salario) : null,
        work_schedule: formData.horario_trabalho,
        pix_key: formData.chave_pix,
        pix_type: formData.tipo_pix,
        bank_name: formData.banco,
        bank_agency: formData.agencia,
        bank_account: formData.conta,
        bank_account_type: formData.tipo_conta,
        emergency_contact_name: formData.contato_emergencia_nome,
        emergency_contact_phone: formData.contato_emergencia_telefone,
        emergency_contact_relation: formData.contato_emergencia_parentesco,
        is_active: formData.is_active,
        avatar_url: formData.foto_url || null,
        password: formData.nova_senha || undefined,
      }

      const res = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao atualizar colaborador')

      toast.success('Colaborador atualizado com sucesso!')
      router.push('/admin/colaboradores')

    } catch (error: any) {
      console.error('Erro ao atualizar colaborador:', error)
      toast.error('Erro ao atualizar: ' + (error?.message || 'Erro desconhecido'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados do colaborador...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Editar Colaborador</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {formData.nome} {formData.sobrenome}
            </p>
          </div>
        </div>
        
        {/* Status Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
          <button
            type="button"
            onClick={() => handleInputChange('is_active', !formData.is_active)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.is_active
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {formData.is_active ? '✓ Ativo' : '✕ Inativo'}
          </button>
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sobrenome *</label>
                <input
                  type="text"
                  value={formData.sobrenome}
                  onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Corporativo
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Pessoal</label>
                <input
                  type="email"
                  value={formData.email_pessoal}
                  onChange={(e) => handleInputChange('email_pessoal', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={formData.nova_senha}
                  onChange={(e) => handleInputChange('nova_senha', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Deixe em branco para manter"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CPF</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data de Nascimento</label>
                <input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
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
              Áreas de Atuação
            </CardTitle>
            <CardDescription>Selecione as áreas em que o colaborador atua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {areasDisponiveis.map((area) => (
                <label
                  key={area.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.areas_atuacao.includes(area.id)
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
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

        {/* Dados Bancários */}
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Banco</label>
                <input
                  type="text"
                  value={formData.banco}
                  onChange={(e) => handleInputChange('banco', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Ex: Nubank, Banco do Brasil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Agência</label>
                <input
                  type="text"
                  value={formData.agencia}
                  onChange={(e) => handleInputChange('agencia', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Administrativas */}
        <Card className="border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-400">
              <Shield className="w-5 h-5" />
              Informações Administrativas
            </CardTitle>
            <CardDescription className="text-yellow-800 dark:text-yellow-500">
              Informações confidenciais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nível Hierárquico</label>
                <select
                  value={formData.nivel_hierarquico}
                  onChange={(e) => handleInputChange('nivel_hierarquico', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Horário de Trabalho</label>
                <select
                  value={formData.horario_trabalho}
                  onChange={(e) => handleInputChange('horario_trabalho', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="integral">Integral</option>
                  <option value="meio_periodo">Meio Período</option>
                  <option value="flexivel">Flexível</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
