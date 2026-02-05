'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Check, Package, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  description: string
  base_price: number
  billing_cycle: string
  deliverables: any
  active: boolean
}

export default function ServiceCatalogPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name')
    
    if (error) {
      toast.error('Erro ao carregar serviços')
    } else {
      setServices(data || [])
    }
    setIsLoading(false)
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const deliverablesRaw = String(formData.get('deliverables') || '').trim()
    let deliverables: any = {}
    if (deliverablesRaw) {
      try {
        deliverables = JSON.parse(deliverablesRaw)
      } catch {
        toast.error('Entregáveis inválidos. Use JSON válido.')
        return
      }
    }
    
    const serviceData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      base_price: parseFloat(formData.get('base_price') as string || '0'),
      billing_cycle: formData.get('billing_cycle') as string,
      deliverables,
      active: true
    }

    if (editingService) {
      const { error } = await supabase.from('services').update(serviceData).eq('id', editingService.id)
      if (error) toast.error('Erro ao atualizar')
      else toast.success('Serviço atualizado!')
    } else {
      const { error } = await supabase.from('services').insert(serviceData)
      if (error) toast.error('Erro ao criar')
      else toast.success('Serviço criado!')
    }

    setIsModalOpen(false)
    setEditingService(null)
    loadServices()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) toast.error('Erro ao deletar')
    else {
      toast.success('Serviço removido')
      loadServices()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catálogo de Serviços</h1>
            <p className="text-gray-500">Defina os produtos e entregáveis padrão da agência.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Package className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium uppercase">
                      {service.billing_cycle}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-bold text-gray-900">
                      R$ {service.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-400 text-sm">/ {service.billing_cycle === 'monthly' ? 'mês' : 'un'}</span>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Entregáveis:</p>
                    {Object.entries(service.deliverables).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        {String(value)}x {key}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setEditingService(service)
                      setIsModalOpen(true)
                    }}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                  <input 
                    name="name" 
                    defaultValue={editingService?.name}
                    required 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Gestão de Redes Sociais"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingService?.description}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="O que está incluso..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
                    <input 
                      name="base_price" 
                      type="number" 
                      step="0.01"
                      defaultValue={editingService?.base_price}
                      required 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo</label>
                    <select 
                      name="billing_cycle" 
                      defaultValue={editingService?.billing_cycle || 'monthly'}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                      <option value="one_time">Único</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entregáveis (JSON)</label>
                  <div className="relative">
                    <textarea 
                      name="deliverables" 
                      defaultValue={JSON.stringify(editingService?.deliverables || {"videos": 4, "posts": 12}, null, 2)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="absolute top-2 right-2 text-xs text-gray-400">JSON</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Use formato JSON: {`{"videos": 4, "posts": 12}`}</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsModalOpen(false)
                      setEditingService(null)
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

