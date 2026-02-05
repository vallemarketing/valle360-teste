'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Lock, Camera, Save, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'pessoais' | 'contato' | 'financeiro' | 'seguranca'

interface ProfileData {
  full_name: string
  email: string
  phone: string
  date_of_birth: string
  avatar_url: string
  address_street: string
  address_number: string
  address_complement: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_zipcode: string
  emergency_contact_name: string
  emergency_contact_phone: string
  pix_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  pix_key: string
}

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pessoais')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    avatar_url: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zipcode: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    pix_type: 'cpf',
    pix_key: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar dados do perfil
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Buscar dados do employee
      const { data: employee } = await supabase
        .from('employees')
        .select('*, employee_personal_data(*), employee_financial_data(*)')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          email: user.email || '',
          phone: profile.phone || '',
          date_of_birth: employee?.employee_personal_data?.[0]?.date_of_birth || '',
          avatar_url: profile.avatar_url || '',
          address_street: employee?.employee_personal_data?.[0]?.address_street || '',
          address_number: employee?.employee_personal_data?.[0]?.address_number || '',
          address_complement: employee?.employee_personal_data?.[0]?.address_complement || '',
          address_neighborhood: employee?.employee_personal_data?.[0]?.address_neighborhood || '',
          address_city: employee?.employee_personal_data?.[0]?.address_city || '',
          address_state: employee?.employee_personal_data?.[0]?.address_state || '',
          address_zipcode: employee?.employee_personal_data?.[0]?.address_zipcode || '',
          emergency_contact_name: employee?.employee_personal_data?.[0]?.emergency_contact_name || '',
          emergency_contact_phone: employee?.employee_personal_data?.[0]?.emergency_contact_phone || '',
          pix_type: employee?.employee_financial_data?.[0]?.pix_type || 'cpf',
          pix_key: employee?.employee_financial_data?.[0]?.pix_key || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar perfil' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não encontrado')

      // Atualizar user_profiles
      await supabase
        .from('user_profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url
        })
        .eq('user_id', user.id)

      // Buscar employee_id
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (employee) {
        // Atualizar employee_personal_data
        await supabase
          .from('employee_personal_data')
          .upsert({
            employee_id: employee.id,
            date_of_birth: profileData.date_of_birth,
            address_street: profileData.address_street,
            address_number: profileData.address_number,
            address_complement: profileData.address_complement,
            address_neighborhood: profileData.address_neighborhood,
            address_city: profileData.address_city,
            address_state: profileData.address_state,
            address_zipcode: profileData.address_zipcode,
            emergency_contact_name: profileData.emergency_contact_name,
            emergency_contact_phone: profileData.emergency_contact_phone
          })

        // Atualizar employee_financial_data
        await supabase
          .from('employee_financial_data')
          .upsert({
            employee_id: employee.id,
            pix_type: profileData.pix_type,
            pix_key: profileData.pix_key
          })
      }

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar perfil' })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'pessoais', label: 'Dados Pessoais', icon: <User className="w-4 h-4" /> },
    { id: 'contato', label: 'Contato', icon: <Phone className="w-4 h-4" /> },
    { id: 'financeiro', label: 'Financeiro', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'seguranca', label: 'Segurança', icon: <Lock className="w-4 h-4" /> },
  ]

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--primary-500)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-73px)] p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Meu Perfil
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        {/* Avatar Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 text-center"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderWidth: '1px',
            borderColor: 'var(--border-light)'
          }}
        >
          <div className="relative inline-block">
            <img
              src={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.email}`}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover ring-4"
              style={{ 
                border: '4px solid var(--primary-100)'
              }}
            />
            <button 
              className="absolute bottom-0 right-0 p-3 rounded-full shadow-lg transition-all hover:scale-110"
              style={{ backgroundColor: 'var(--primary-500)' }}
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
          <h2 className="text-2xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
            {profileData.full_name || 'Sem nome'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {profileData.email}
          </p>
        </motion.div>

        {/* Tabs */}
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderWidth: '1px',
            borderColor: 'var(--border-light)'
          }}
        >
          {/* Tab Headers */}
          <div className="flex border-b" style={{ borderColor: 'var(--border-light)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex-1 px-6 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all relative',
                  activeTab === tab.id ? '' : 'hover:bg-opacity-50'
                )}
                style={{
                  color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                  backgroundColor: activeTab === tab.id ? 'var(--primary-50)' : 'transparent'
                }}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: 'var(--primary-500)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Dados Pessoais */}
            {activeTab === 'pessoais' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Contato */}
            {activeTab === 'contato' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border opacity-60 cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-secondary)'
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Email não pode ser alterado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Contato de Emergência
                    </label>
                    <input
                      type="text"
                      value={profileData.emergency_contact_name}
                      onChange={(e) => setProfileData({ ...profileData, emergency_contact_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-0">Telefone</label>
                    <input
                      type="tel"
                      value={profileData.emergency_contact_phone}
                      onChange={(e) => setProfileData({ ...profileData, emergency_contact_phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Telefone"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Endereço</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={profileData.address_street}
                        onChange={(e) => setProfileData({ ...profileData, address_street: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-light)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Rua"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={profileData.address_number}
                        onChange={(e) => setProfileData({ ...profileData, address_number: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-light)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Número"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={profileData.address_complement}
                      onChange={(e) => setProfileData({ ...profileData, address_complement: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Complemento"
                    />
                    <input
                      type="text"
                      value={profileData.address_neighborhood}
                      onChange={(e) => setProfileData({ ...profileData, address_neighborhood: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Bairro"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={profileData.address_city}
                      onChange={(e) => setProfileData({ ...profileData, address_city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Cidade"
                    />
                    <input
                      type="text"
                      value={profileData.address_state}
                      onChange={(e) => setProfileData({ ...profileData, address_state: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Estado"
                      maxLength={2}
                    />
                    <input
                      type="text"
                      value={profileData.address_zipcode}
                      onChange={(e) => setProfileData({ ...profileData, address_zipcode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="CEP"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Financeiro */}
            {activeTab === 'financeiro' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Tipo de Chave PIX
                  </label>
                  <select
                    value={profileData.pix_type}
                    onChange={(e) => setProfileData({ ...profileData, pix_type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={profileData.pix_key}
                    onChange={(e) => setProfileData({ ...profileData, pix_key: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Digite sua chave PIX"
                  />
                </div>

                <div 
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{ backgroundColor: 'var(--info-50)' }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--info-500)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--info-700)' }}>
                      Informação Importante
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--info-600)' }}>
                      Esta chave PIX será usada para pagamentos e reembolsos.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Segurança */}
            {activeTab === 'seguranca' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Alterar Senha
                  </h3>
                  <button 
                    className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 text-white"
                    style={{ backgroundColor: 'var(--primary-500)' }}
                  >
                    Solicitar Alteração de Senha
                  </button>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Um link será enviado para seu email para redefinir sua senha
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ 
              backgroundColor: message.type === 'success' ? 'var(--success-50)' : 'var(--error-50)',
            }}
          >
            <AlertCircle 
              className="w-5 h-5" 
              style={{ color: message.type === 'success' ? 'var(--success-500)' : 'var(--error-500)' }} 
            />
            <p 
              className="text-sm font-medium"
              style={{ color: message.type === 'success' ? 'var(--success-700)' : 'var(--error-700)' }}
            >
              {message.text}
            </p>
          </motion.div>
        )}

        {/* Save Button */}
        <div className="sticky bottom-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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

      </div>
    </div>
  )
}
