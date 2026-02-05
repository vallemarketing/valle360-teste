'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Plus, Edit2, Trash2, Save, X,
  DollarSign, Tag, Check, AlertTriangle,
  Search, Filter, MoreVertical, Copy, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  description: string
  category: string
  base_price: number
  price_type: 'fixed' | 'hourly' | 'monthly' | 'per_unit'
  is_active: boolean
  features: string[]
  created_at: string
}

const CATEGORIES = [
  'Marketing Digital',
  'Desenvolvimento Web',
  'Design',
  'Produção de Vídeo',
  'Tráfego Pago',
  'Social Media',
  'Consultoria',
  'Outros'
]

const PRICE_TYPES = [
  { value: 'fixed', label: 'Valor Fixo' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'hourly', label: 'Por Hora' },
  { value: 'per_unit', label: 'Por Unidade' }
]

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)

  const supabase = createClientComponentClient()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Marketing Digital',
    base_price: 0,
    price_type: 'fixed' as 'fixed' | 'hourly' | 'monthly' | 'per_unit',
    is_active: true,
    features: ['']
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('configurable_services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category || 'Marketing Digital',
        base_price: service.base_price,
        price_type: service.price_type,
        is_active: service.is_active,
        features: service.features?.length ? service.features : ['']
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        category: 'Marketing Digital',
        base_price: 0,
        price_type: 'fixed',
        is_active: true,
        features: ['']
      })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name || formData.base_price <= 0) {
      toast.error('Preencha nome e preço do serviço')
      return
    }

    setSaving(true)
    try {
      const features = formData.features.filter(f => f.trim())
      
      if (editingService) {
        const { error } = await supabase
          .from('configurable_services')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            base_price: formData.base_price,
            price_type: formData.price_type,
            is_active: formData.is_active,
            features: features,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id)

        if (error) throw error
        toast.success('Serviço atualizado!')
      } else {
        const { error } = await supabase
          .from('configurable_services')
          .insert({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            base_price: formData.base_price,
            price_type: formData.price_type,
            is_active: formData.is_active,
            features: features
          })

        if (error) throw error
        toast.success('Serviço criado!')
      }

      setShowModal(false)
      fetchServices()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar serviço')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('configurable_services')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Serviço excluído!')
      fetchServices()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir serviço')
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('configurable_services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id)

      if (error) throw error
      toast.success(service.is_active ? 'Serviço desativado' : 'Serviço ativado')
      fetchServices()
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      toast.error('Erro ao atualizar serviço')
    }
  }

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] })
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [''] })
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number, type: string) => {
    const formatted = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    switch (type) {
      case 'hourly': return `${formatted}/hora`
      case 'monthly': return `${formatted}/mês`
      case 'per_unit': return `${formatted}/un`
      default: return formatted
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Configuração de Serviços</h1>
            <p className="text-sm text-gray-500">Gerencie os serviços disponíveis para propostas</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Total de Serviços</p>
          <p className="text-2xl font-bold text-gray-800">{services.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Serviços Ativos</p>
          <p className="text-2xl font-bold text-green-600">{services.filter(s => s.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Serviços Inativos</p>
          <p className="text-2xl font-bold text-gray-400">{services.filter(s => !s.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Categorias</p>
          <p className="text-2xl font-bold text-blue-600">{new Set(services.map(s => s.category)).size}</p>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Carregando serviços...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum serviço encontrado</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Criar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all",
                !service.is_active && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{service.name}</h3>
                    {!service.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                        Inativo
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {service.category}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(service)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-gray-800">
                  {formatPrice(service.base_price, service.price_type)}
                </span>
              </div>

              {service.features?.length > 0 && (
                <div className="space-y-1 mb-3">
                  {service.features.slice(0, 3).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                  {service.features.length > 3 && (
                    <p className="text-xs text-gray-400">+{service.features.length - 3} mais</p>
                  )}
                </div>
              )}

              <button
                onClick={() => handleToggleActive(service)}
                className={cn(
                  "w-full py-2 rounded-lg text-sm font-medium transition-colors",
                  service.is_active
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                )}
              >
                {service.is_active ? 'Desativar' : 'Ativar'}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Gestão de Redes Sociais"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva o serviço..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Preço</label>
                    <select
                      value={formData.price_type}
                      onChange={(e) => setFormData({ ...formData, price_type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRICE_TYPES.map(pt => (
                        <option key={pt.value} value={pt.value}>{pt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$) *</label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Características</label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: 30 posts por mês"
                        />
                        {formData.features.length > 1 && (
                          <button
                            onClick={() => removeFeature(index)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addFeature}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Adicionar característica
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Serviço ativo
                  </label>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}






