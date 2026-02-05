'use client'

/**
 * Valle 360 - Gestão de Clientes (Super Admin)
 * Com menu de ações, modais e toggle de ativação
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, Filter, MoreVertical, Mail, Phone, Globe, 
  MapPin, TrendingUp, Calendar, X, Eye, Settings, Edit, 
  Power, PowerOff, Check, AlertTriangle, Building2, User, Users,
  Sparkles, ToggleLeft, ToggleRight, FileText, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// =====================================================
// TIPOS
// =====================================================

interface Client {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  industry: string
  status: 'active' | 'inactive' | 'pending'
  monthlyValue: number
  startDate: string
  avatar: string
  address?: string
  city?: string
  state?: string
  cnpj?: string
  website?: string
  services?: string[]
}

interface Feature {
  id: string
  code: string
  name: string
  description: string
  category: string
  enabled: boolean
}

// =====================================================
// DADOS REAIS
// =====================================================

const mockFeatures: Feature[] = [
  { id: '1', code: 'reputation', name: 'Central de Reputação', description: 'NPS, Google, Reclame Aqui', category: 'analytics', enabled: true },
  { id: '2', code: 'insights_predictive', name: 'Insights Preditivos', description: 'Análises e sugestões com IA', category: 'ai', enabled: true },
  { id: '3', code: 'franchisee_analysis', name: 'Análise de Franqueados', description: 'Gestão de franquias', category: 'management', enabled: false },
  { id: '4', code: 'val_ai', name: 'Assistente Val IA', description: 'Chat inteligente', category: 'ai', enabled: true },
  { id: '5', code: 'gamification', name: 'Valle Club', description: 'Gamificação e recompensas', category: 'engagement', enabled: false },
  { id: '6', code: 'advanced_reports', name: 'Relatórios Avançados', description: 'Exportação e BI', category: 'analytics', enabled: false },
  { id: '7', code: 'integrations_google', name: 'Integração Google', description: 'Ads, Analytics, GMB', category: 'integration', enabled: true },
  { id: '8', code: 'integrations_meta', name: 'Integração Meta', description: 'Facebook, Instagram', category: 'integration', enabled: true },
]

// =====================================================
// COMPONENTES DE MODAL
// =====================================================

// Modal de Detalhes do Cliente
function ClientDetailsModal({ 
  client, 
  onClose 
}: { 
  client: Client
  onClose: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <img src={client.avatar} alt={client.companyName} className="w-14 h-14 rounded-xl" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{client.companyName}</h2>
              <p className="text-gray-500">{client.industry}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              client.status === 'active' && "bg-green-100 text-green-700",
              client.status === 'inactive' && "bg-red-100 text-red-700",
              client.status === 'pending' && "bg-yellow-100 text-yellow-700"
            )}>
              {client.status === 'active' ? 'Ativo' : client.status === 'inactive' ? 'Inativo' : 'Pendente'}
            </span>
            <span className="text-gray-500 text-sm">Cliente desde {new Date(client.startDate).toLocaleDateString('pt-BR')}</span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Contato Principal</label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{client.contactName}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{client.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Telefone</label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{client.phone}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Valor Mensal</label>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-bold">R$ {client.monthlyValue.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {client.cnpj && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase tracking-wider">CNPJ</label>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{client.cnpj}</span>
                </div>
              </div>
            )}

            {client.city && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Localização</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{client.city}, {client.state}</span>
                </div>
              </div>
            )}
          </div>

          {/* Serviços Contratados */}
          {client.services && client.services.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Serviços Contratados</label>
              <div className="flex flex-wrap gap-2">
                {client.services.map(service => (
                  <span key={service} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {service === 'social_media' ? 'Social Media' : 
                     service === 'trafego_pago' ? 'Tráfego Pago' : 
                     service === 'design' ? 'Design' : 
                     service === 'web' ? 'Web' : service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <Link href={`/admin/clientes/${client.id}`}>
            <button className="px-4 py-2 bg-[#1672d6] text-white rounded-lg hover:bg-[#1260b5] transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editar Cliente
            </button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Modal de Gestão de Serviços/Features
function ClientServicesModal({ 
  client, 
  onClose,
  onSave
}: { 
  client: Client
  onClose: () => void
  onSave: (clientId: string, features: Feature[]) => void
}) {
  const [features, setFeatures] = useState<Feature[]>(mockFeatures)

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, enabled: !f.enabled } : f
    ))
  }

  const handleSave = () => {
    onSave(client.id, features)
    onClose()
  }

  const categories = {
    analytics: 'Análises',
    ai: 'Inteligência Artificial',
    management: 'Gestão',
    engagement: 'Engajamento',
    integration: 'Integrações'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Serviços</h2>
              <p className="text-gray-500 text-sm">{client.companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600 text-sm">
            Ative ou desative as funcionalidades disponíveis para este cliente.
          </p>

          {Object.entries(categories).map(([catKey, catLabel]) => {
            const categoryFeatures = features.filter(f => f.category === catKey)
            if (categoryFeatures.length === 0) return null

            return (
              <div key={catKey} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {catLabel}
                </h3>
                <div className="space-y-2">
                  {categoryFeatures.map(feature => (
                    <div
                      key={feature.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        feature.enabled 
                          ? "border-green-200 bg-green-50 dark:bg-green-900/20" 
                          : "border-gray-200 bg-gray-50 dark:bg-gray-700/50"
                      )}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{feature.name}</h4>
                        <p className="text-sm text-gray-500">{feature.description}</p>
                      </div>
                      <button
                        onClick={() => toggleFeature(feature.id)}
                        className={cn(
                          "relative w-14 h-7 rounded-full transition-colors",
                          feature.enabled ? "bg-green-500" : "bg-gray-300"
                        )}
                      >
                        <motion.div
                          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                          animate={{ left: feature.enabled ? '32px' : '4px' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">
            {features.filter(f => f.enabled).length} de {features.length} funcionalidades ativas
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#1672d6] text-white rounded-lg hover:bg-[#1260b5] transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Modal de Confirmação de Toggle
function ToggleConfirmModal({ 
  client, 
  action, 
  onConfirm, 
  onCancel 
}: { 
  client: Client
  action: 'activate' | 'deactivate'
  onConfirm: () => void
  onCancel: () => void
}) {
  const isDeactivating = action === 'deactivate'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className={cn(
            "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
            isDeactivating ? "bg-red-100" : "bg-green-100"
          )}>
            {isDeactivating ? (
              <PowerOff className="w-8 h-8 text-red-600" />
            ) : (
              <Power className="w-8 h-8 text-green-600" />
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isDeactivating ? 'Desativar Acesso' : 'Ativar Acesso'}
          </h2>

          <p className="text-gray-600 mb-6">
            Tem certeza que deseja <strong>{isDeactivating ? 'desativar' : 'ativar'}</strong> o acesso de{' '}
            <strong>{client.companyName}</strong>?
            {isDeactivating && (
              <span className="block mt-2 text-sm text-red-600">
                O cliente perderá acesso imediato ao sistema.
              </span>
            )}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "px-6 py-2.5 text-white rounded-lg transition-colors font-medium flex items-center gap-2",
                isDeactivating 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {isDeactivating ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              Confirmar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Dropdown Menu
function ClientActionMenu({ 
  client,
  onViewDetails,
  onManageServices,
  onToggleAccess,
  onEdit
}: {
  client: Client
  onViewDetails: () => void
  onManageServices: () => void
  onToggleAccess: () => void
  onEdit: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            <button
              onClick={() => { onViewDetails(); setIsOpen(false); }}
              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700 dark:text-gray-200">Ver Detalhes</span>
            </button>

            <button
              onClick={() => { onManageServices(); setIsOpen(false); }}
              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4 text-purple-500" />
              <span className="text-gray-700 dark:text-gray-200">Gerenciar Serviços</span>
            </button>

            <Link href={`/admin/clientes/${client.id}/equipe`}>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 dark:text-gray-200">Gerenciar Equipe</span>
              </button>
            </Link>

            <button
              onClick={() => { onEdit(); setIsOpen(false); }}
              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-200">Editar Cliente</span>
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            <button
              onClick={() => { onToggleAccess(); setIsOpen(false); }}
              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {client.status === 'active' ? (
                <>
                  <PowerOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Desativar Acesso</span>
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Ativar Acesso</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function ClientsListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  
  // Modals state
  const [detailsModal, setDetailsModal] = useState<Client | null>(null)
  const [servicesModal, setServicesModal] = useState<Client | null>(null)
  const [toggleModal, setToggleModal] = useState<{ client: Client; action: 'activate' | 'deactivate' } | null>(null)
  const [creatingTestClient, setCreatingTestClient] = useState(false)
  const [testClientCreds, setTestClientCreds] = useState<{ email: string; password: string } | null>(null)

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    const colors = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ativo' },
      inactive: { bg: 'bg-red-100', text: 'text-red-700', label: 'Inativo' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' }
    }
    return colors[status as keyof typeof colors]
  }

  const totalMonthlyRevenue = filteredClients.reduce((sum, client) => sum + client.monthlyValue, 0)

  const handleToggleAccess = (client: Client) => {
    setToggleModal({
      client,
      action: client.status === 'active' ? 'deactivate' : 'activate'
    })
  }

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
      return {}
    }
  }

  const createTestClient = async () => {
    try {
      setCreatingTestClient(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/create-test-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ company_name: 'Cliente Teste (Social)' }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao criar cliente de teste')

      const email = String(data?.credentials?.email || '')
      const password = String(data?.credentials?.password || '')
      setTestClientCreds({ email, password })

      try {
        await navigator.clipboard.writeText(`Email: ${email}\nSenha: ${password}`)
        toast.success('Cliente de teste criado (copiado)', { description: 'Credenciais copiadas para a área de transferência.' })
      } catch {
        toast.success('Cliente de teste criado', { description: 'Abra o modal para copiar as credenciais.' })
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar cliente de teste')
    } finally {
      setCreatingTestClient(false)
    }
  }

  const loadClientsReal = async () => {
    try {
      setClientsLoading(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/clients', { headers: authHeaders })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar clientes')
      setClients(Array.isArray(data?.clients) ? data.clients : [])
    } catch {
      setClients([])
      toast.error('Falha ao carregar clientes', { description: 'Verifique permissões e integrações do Supabase.' })
    }
    finally {
      setClientsLoading(false)
    }
  }

  useEffect(() => {
    loadClientsReal()
  }, [])

  const confirmToggle = async () => {
    if (!toggleModal) return

    const nextStatus = toggleModal.action === 'activate' ? 'active' : 'inactive'
    setClients(prev => prev.map(c => c.id === toggleModal.client.id ? { ...c, status: nextStatus } : c))
    setToggleModal(null)

    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          userId: (toggleModal.client as any).userId || toggleModal.client.id,
          status: nextStatus,
        }),
      })
      if (!res.ok) {
        toast.error('Falha ao atualizar status no banco')
      } else {
        toast.success(`Status atualizado: ${nextStatus === 'active' ? 'Ativo' : 'Inativo'}`)
      }
    } catch {
      toast.error('Falha ao atualizar status no banco')
    }
  }

  const handleSaveServices = async (clientId: string, features: Feature[]) => {
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ clientId, features }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar serviços')
      toast.success('Serviços/Features atualizados!')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar serviços')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              Clientes
            </h1>
            <p className="text-gray-500">
              Gerencie todos os clientes da Valle 360
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={createTestClient}
              disabled={creatingTestClient}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-gray-900 shadow-sm bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <Sparkles className="w-5 h-5 text-[#1672d6]" />
              {creatingTestClient ? 'Criando…' : 'Criar cliente de teste'}
            </motion.button>

            <Link href="/admin/clientes/novo">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white shadow-md bg-[#1672d6] hover:bg-[#1260b5] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Cliente
            </motion.button>
          </Link>
        </div>
        </div>

        {/* Modal: credenciais do cliente de teste */}
        <AnimatePresence>
          {testClientCreds && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setTestClientCreds(null)}
            >
              <motion.div
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.97, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cliente de teste criado</h3>
                    <p className="text-sm text-gray-500">Use essas credenciais para logar em <span className="font-mono">/login</span>.</p>
                  </div>
                  <button onClick={() => setTestClientCreds(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-3">
                  <div className="rounded-xl border bg-gray-50 dark:bg-gray-900 p-4">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{testClientCreds.email}</p>
                  </div>
                  <div className="rounded-xl border bg-gray-50 dark:bg-gray-900 p-4">
                    <p className="text-xs text-gray-500 mb-1">Senha</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{testClientCreds.password}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`Email: ${testClientCreds.email}\nSenha: ${testClientCreds.password}`)
                          toast.success('Copiado!')
                        } catch {
                          toast.error('Não foi possível copiar')
                        }
                      }}
                      className="px-4 py-2 rounded-lg border text-sm"
                    >
                      Copiar
                    </button>
                    <button
                      onClick={() => setTestClientCreds(null)}
                      className="px-4 py-2 rounded-lg bg-[#1672d6] text-white text-sm"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6 shadow-sm border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium mb-2 text-gray-500">Total de Clientes</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium mb-2 text-gray-500">Clientes Ativos</p>
            <p className="text-3xl font-bold text-green-600">{clients.filter(c => c.status === 'active').length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-6 shadow-sm border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium mb-2 text-gray-500">Clientes Inativos</p>
            <p className="text-3xl font-bold text-red-600">{clients.filter(c => c.status === 'inactive').length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-6 shadow-sm border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium mb-2 text-gray-500">Receita Mensal</p>
            <p className="text-3xl font-bold text-[#1672d6]">R$ {(totalMonthlyRevenue / 1000).toFixed(1)}k</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, contato ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.map((client, index) => {
            const statusInfo = getStatusColor(client.status)
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl p-6 shadow-sm border hover:shadow-md transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={client.avatar}
                      alt={client.companyName}
                      className="w-16 h-16 rounded-xl"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {client.companyName}
                        </h3>
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium", statusInfo.bg, statusInfo.text)}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-500 min-w-0">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client.contactName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 min-w-0">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 min-w-0">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client.industry}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="font-semibold text-green-600 whitespace-nowrap">
                            R$ {client.monthlyValue.toLocaleString('pt-BR')} /mês
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle rápido */}
                    <button
                      onClick={() => handleToggleAccess(client)}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        client.status === 'active' ? "bg-green-500" : "bg-gray-300"
                      )}
                      title={client.status === 'active' ? 'Clique para desativar' : 'Clique para ativar'}
                    >
                      <motion.div
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                        animate={{ left: client.status === 'active' ? '26px' : '4px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>

                    <button
                      onClick={() => setDetailsModal(client)}
                      className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      Ver Detalhes
                    </button>

                    <ClientActionMenu
                      client={client}
                      onViewDetails={() => setDetailsModal(client)}
                      onManageServices={() => setServicesModal(client)}
                      onToggleAccess={() => handleToggleAccess(client)}
                      onEdit={() => window.location.href = `/admin/clientes/${client.id}`}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {clientsLoading ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-500">Carregando clientes...</p>
          </div>
        ) : filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-500">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {detailsModal && (
          <ClientDetailsModal 
            client={detailsModal} 
            onClose={() => setDetailsModal(null)} 
          />
        )}

        {servicesModal && (
          <ClientServicesModal 
            client={servicesModal} 
            onClose={() => setServicesModal(null)}
            onSave={handleSaveServices}
          />
        )}

        {toggleModal && (
          <ToggleConfirmModal
            client={toggleModal.client}
            action={toggleModal.action}
            onConfirm={confirmToggle}
            onCancel={() => setToggleModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
