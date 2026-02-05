'use client'

import { useEffect, useState } from 'react'
import { FileText, HelpCircle, Clock, CheckCircle, XCircle, Send, Plus, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'

const REQUEST_TYPES = [
  { id: 'vacation', label: 'Férias', icon: '🏖️' },
  { id: 'dayoff', label: 'Folga / Day Off', icon: '📅' },
  { id: 'home_office', label: 'Home Office', icon: '🏠' },
  { id: 'equipment', label: 'Equipamento', icon: '💻' },
  { id: 'refund', label: 'Reembolso', icon: '💰' }
]

type RequestStatus = 'pending' | 'approved' | 'rejected'
type RequestRow = {
  id: string
  title?: string
  type: string
  start_date?: string | null
  end_date?: string | null
  reason?: string | null
  amount?: string | null
  status: RequestStatus
  created_at?: string
}

export default function SolicitacoesPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list')
  const [selectedType, setSelectedType] = useState(REQUEST_TYPES[0].id)
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/requests')
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao carregar solicitações')
      setRequests((data.requests || []) as RequestRow[])
    } catch (e) {
      console.error(e)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate) return toast.error('Selecione a data de início')
    if (!reason.trim()) return toast.error('Descreva a justificativa')

    setSubmitting(true)
    try {
      const payload: any = {
        type: selectedType,
        start_date: startDate,
        end_date: endDate || null,
        reason: reason.trim(),
        attachments: attachment ? [{ name: attachment.name, size: attachment.size, type: attachment.type }] : [],
      }
      if (selectedType === 'refund' && amount) payload.amount = amount

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao enviar solicitação')

      toast.success('Solicitação enviada para aprovação!')
      setActiveTab('list')
      setAttachment(null)
      setStartDate('')
      setEndDate('')
      setReason('')
      setAmount('')
      await loadRequests()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao enviar solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0])
      toast.success('Arquivo anexado!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Solicitações e Requisições</h1>
            <p className="text-gray-500">Gerencie seus pedidos de férias, folgas e materiais.</p>
          </div>
          {activeTab === 'list' && (
            <button
              onClick={() => setActiveTab('new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              <Plus className="w-5 h-5" />
              Nova Solicitação
            </button>
          )}
        </div>

        {activeTab === 'list' ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Histórico de Pedidos</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-6 text-sm text-gray-500">Carregando…</div>
              ) : requests.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    type="tasks"
                    title="Nenhuma solicitação ainda"
                    description="Quando você enviar uma solicitação (férias, reembolso, etc.), ela aparece aqui para acompanhamento."
                    animated={false}
                    size="sm"
                  />
                </div>
              ) : (
                requests.map((req) => {
                  const t = REQUEST_TYPES.find((x) => x.id === req.type)
                  const created = req.created_at ? String(req.created_at).slice(0, 10) : ''
                  const period = req.start_date ? `${req.start_date}${req.end_date ? ` → ${req.end_date}` : ''}` : ''

                  return (
                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                          {t?.icon || '📝'}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{t?.label || 'Solicitação'}</h3>
                          <p className="text-sm text-gray-500">Solicitado em: {created || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 font-medium">
                          {req.type === 'refund' ? (req.amount ? `R$ ${req.amount}` : '-') : (period || '-')}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {req.status === 'approved' && 'Aprovado'}
                          {req.status === 'rejected' && 'Rejeitado'}
                          {req.status === 'pending' && 'Em Análise'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setActiveTab('list')} className="text-gray-400 hover:text-gray-600">
                    Voltar
                </button>
                <h2 className="text-xl font-bold text-gray-900">Criar Nova Solicitação</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Solicitação</label>
                <div className="grid grid-cols-3 gap-3">
                  {REQUEST_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedType === type.id
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{type.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim (Opcional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa / Detalhes</label>
                <textarea 
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Descreva o motivo da sua solicitação..."
                ></textarea>
              </div>

              {selectedType === 'refund' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                    <label className="flex flex-col items-center cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Upload do Comprovante</span>
                        <span className="text-xs text-gray-500">PDF ou Imagem (Max 5MB)</span>
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                    </label>
                    {attachment && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                            <CheckCircle className="w-4 h-4" />
                            {attachment.name}
                        </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Enviando…' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
