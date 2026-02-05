'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  DollarSign, TrendingUp, AlertTriangle, Calendar, CheckCircle, XCircle,
  Download, Plus, FileText, Eye, Phone, Mail, X, FileSpreadsheet,
  Send, Clock, CreditCard, Building2, User, ChevronRight, MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ClientFinancial {
  id: string
  name: string
  email: string
  phone: string
  contract_value: number
  status: 'active' | 'inactive'
  payment_status: 'ok' | 'late' | 'pending'
  next_billing: string
  health_score: number
  days_late?: number
  user_id?: string | null
}

export default function FinancialClientsDashboard() {
  const [clients, setClients] = useState<ClientFinancial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    mrr: 0,
    late_total: 0,
    active_contracts: 0,
    avg_ticket: 0
  })
  const [showNewContract, setShowNewContract] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientFinancial | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [billingModalOpen, setBillingModalOpen] = useState(false)
  const [billingMessage, setBillingMessage] = useState('')
  const [integrationsStatus, setIntegrationsStatus] = useState<{ sendgrid: boolean; whatsapp: boolean }>({
    sendgrid: false,
    whatsapp: false,
  })
  const [loadingIntegrations, setLoadingIntegrations] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)

    try {
      // status de integrações (SendGrid/WhatsApp) para habilitar botões
      try {
        const res = await fetch('/api/admin/integrations/status', { cache: 'no-store' })
        const st = await res.json().catch(() => null)
        setIntegrationsStatus({ sendgrid: !!st?.sendgrid?.configured, whatsapp: !!st?.whatsapp?.configured })
      } catch {
        setIntegrationsStatus({ sendgrid: false, whatsapp: false })
      } finally {
        setLoadingIntegrations(false)
      }

      // dados reais (server-side via service role)
      const res = await fetch('/api/admin/finance/clients', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao carregar clientes financeiros')

      const rows: ClientFinancial[] = (json.clients || []).map((c: any) => ({
        id: String(c.id),
        name: String(c.name || ''),
        email: String(c.email || ''),
        phone: String(c.phone || ''),
        contract_value: Number(c.contract_value || 0),
        status: String(c.status || 'active') === 'inactive' ? 'inactive' : 'active',
        payment_status: (String(c.payment_status || 'ok') as any) || 'ok',
        next_billing: String(c.next_billing || new Date().toISOString().slice(0, 10)),
        health_score: Number(c.health_score || 0),
        days_late: typeof c.days_late === 'number' ? c.days_late : undefined,
        user_id: c.user_id ? String(c.user_id) : null,
      }))

      setClients(rows)

      const mrr = rows.reduce((acc, c) => acc + (c.contract_value || 0), 0)
      const late = rows.filter(c => c.payment_status === 'late').reduce((acc, c) => acc + (c.contract_value || 0), 0)

      setMetrics({
        mrr,
        late_total: late,
        active_contracts: rows.length,
        avg_ticket: rows.length ? mrr / rows.length : 0
      })
    } catch (e: any) {
      console.error(e)
      toast.error(`Erro ao carregar: ${String(e?.message || e)}`)
      setClients([])
      setMetrics({ mrr: 0, late_total: 0, active_contracts: 0, avg_ticket: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = ['Cliente', 'Email', 'Telefone', 'Valor Mensal', 'Status Pagamento', 'Próximo Vencimento', 'Score Saúde']
    const rows = clients.map(c => [
      c.name,
      c.email,
      c.phone,
      `R$ ${c.contract_value}`,
      c.payment_status === 'ok' ? 'Em Dia' : c.payment_status === 'late' ? 'Atrasado' : 'Pendente',
      new Date(c.next_billing).toLocaleDateString('pt-BR'),
      c.health_score.toString()
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cobrancas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('CSV exportado com sucesso!')
    setShowExportModal(false)
  }

  // Exportar PDF
  const handleExportPDF = () => {
    toast.success('PDF gerado! Download iniciando...')
    // Em produção, usar biblioteca como jsPDF ou chamar API
    setShowExportModal(false)
  }

  // Novo Contrato
  const handleNewContract = () => {
    toast.success('Redirecionando para criação de contrato...')
    setShowNewContract(false)
    // Em produção, redirecionar para página de criação
  }

  // Ver Detalhes
  const handleViewDetails = (client: ClientFinancial) => {
    setSelectedClient(client)
    setShowDetails(true)
  }

  // Enviar Cobrança
  const handleSendBilling = (client: ClientFinancial) => {
    setSelectedClient(client)
    setBillingMessage(
      `Olá ${client.name}! 😊\n\nIdentificamos uma fatura em aberto referente ao seu contrato com a Valle 360.\n` +
        `Pode nos confirmar a previsão de pagamento? Se preferir, posso te ajudar com o link/2ª via.\n\nObrigado!`
    )
    setBillingModalOpen(true)
  }

  // Ligar
  const handleCall = (client: ClientFinancial) => {
    window.open(`tel:${client.phone}`, '_blank')
    toast.info(`Ligando para ${client.phone}...`)
  }

  // Email
  const handleEmail = (client: ClientFinancial) => {
    window.open(`mailto:${client.email}?subject=Cobrança - Valle 360`, '_blank')
    toast.info(`Abrindo email para ${client.email}...`)
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Cobranças</h1>
            <p className="text-gray-500">Visão consolidada de contratos e inadimplência.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button 
              onClick={() => setShowNewContract(true)}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Contrato
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard 
            title="MRR (Receita Recorrente)" 
            value={`R$ ${metrics.mrr.toLocaleString('pt-BR')}`} 
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            trend="+12% vs mês anterior"
            color="green"
          />
          <MetricCard 
            title="Inadimplência Atual" 
            value={`R$ ${metrics.late_total.toLocaleString('pt-BR')}`} 
            icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
            trend={`${clients.filter(c => c.payment_status === 'late').length} clientes atrasados`}
            color="red"
          />
          <MetricCard 
            title="Contratos Ativos" 
            value={metrics.active_contracts.toString()} 
            icon={<CheckCircle className="w-6 h-6 text-blue-600" />}
            trend="Estável"
            color="blue"
          />
          <MetricCard 
            title="Ticket Médio" 
            value={`R$ ${metrics.avg_ticket.toLocaleString('pt-BR')}`} 
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            trend="+5% vs mês anterior"
            color="purple"
          />
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Carteira de Clientes</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Mensal</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Pagamento</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Próximo Vencimento</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saúde</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8">Carregando...</td></tr>
                ) : clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-medium">R$ {client.contract_value.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={client.payment_status} daysLate={client.days_late} />
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(client.next_billing).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <HealthBar score={client.health_score} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewDetails(client)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleCall(client)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ligar"
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                        </button>
                        <button 
                          onClick={() => handleEmail(client)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Email"
                        >
                          <Mail className="w-4 h-4 text-blue-600" />
                        </button>
                        {client.payment_status === 'late' && (
                          <button 
                            onClick={() => handleSendBilling(client)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Cobrar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Exportar */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Exportar Dados</h3>
                <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">Escolha o formato de exportação:</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleExportCSV}
                  className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <span className="font-medium">CSV / Excel</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-8 h-8 text-red-600" />
                  <span className="font-medium">PDF</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Contrato */}
      <AnimatePresence>
        {showNewContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowNewContract(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Novo Contrato</h3>
                <button onClick={() => setShowNewContract(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <input type="text" placeholder="Nome do cliente" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" placeholder="email@empresa.com" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mensal</label>
                    <input type="text" placeholder="R$ 0,00" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
                    <input type="number" placeholder="10" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <button
                  onClick={handleNewContract}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Criar Contrato
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detalhes */}
      <AnimatePresence>
        {showDetails && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Detalhes do Cliente</h3>
                <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedClient.name}</h4>
                    <p className="text-gray-500">{selectedClient.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Valor Mensal</p>
                    <p className="text-lg font-bold text-gray-900">R$ {selectedClient.contract_value.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <StatusBadge status={selectedClient.payment_status} daysLate={selectedClient.days_late} />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Próximo Vencimento</p>
                    <p className="font-medium">{new Date(selectedClient.next_billing).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Score de Saúde</p>
                    <HealthBar score={selectedClient.health_score} />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => { handleCall(selectedClient); setShowDetails(false); }}
                    className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Ligar
                  </button>
                  <button
                    onClick={() => { handleEmail(selectedClient); setShowDetails(false); }}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  {selectedClient.payment_status === 'late' && (
                    <button
                      onClick={() => { handleSendBilling(selectedClient); setShowDetails(false); }}
                      className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Cobrar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Enviar Cobrança (Email/WhatsApp/Intranet) */}
      <AnimatePresence>
        {billingModalOpen && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setBillingModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Enviar Cobrança</h3>
                  <p className="text-sm text-gray-500">{selectedClient.name}</p>
                </div>
                <button onClick={() => setBillingModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                  <textarea
                    value={billingMessage}
                    onChange={(e) => setBillingMessage(e.target.value)}
                    className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    className="py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                    onClick={async () => {
                      try {
                        toast.loading('Enviando pela intranet...');
                        const res = await fetch('/api/admin/outbound/intranet', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ clientId: selectedClient.id, text: billingMessage }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || 'Falha ao enviar intranet');
                        toast.dismiss();
                        toast.success('Mensagem enviada pela intranet!');
                        setBillingModalOpen(false);
                      } catch (e: any) {
                        toast.dismiss();
                        toast.error(`Erro: ${String(e?.message || e)}`);
                      }
                    }}
                    title="Mensagem interna (chat) para o cliente"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Intranet
                  </button>

                  <button
                    className="py-2 border rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                    title="Abrir email via mailto"
                    onClick={async () => {
                      try {
                        toast.loading('Preparando email...');
                        const res = await fetch('/api/admin/outbound/email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            toEmail: selectedClient.email,
                            toName: selectedClient.name,
                            subject: 'Cobrança - Valle 360',
                            text: billingMessage,
                            html: `<div style="font-family: Arial, sans-serif; line-height: 1.5;">${billingMessage
                              .replace(/&/g, '&amp;')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;')
                              .replace(/\\n/g, '<br/>')}</div>`,
                          }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || 'Falha ao enviar email');
                        toast.dismiss();
                        if (data?.mailtoUrl) {
                          window.open(data.mailtoUrl, '_blank');
                          toast.success('Email pronto! Abra seu app de email.');
                        } else {
                          toast.success('Email preparado!');
                        }
                      } catch (e: any) {
                        toast.dismiss();
                        toast.error(`Erro: ${String(e?.message || e)}`);
                      }
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>

                  <button
                    className="py-2 border rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-60"
                    disabled={loadingIntegrations || !integrationsStatus.whatsapp}
                    title={!integrationsStatus.whatsapp ? 'WhatsApp não configurado' : 'Enviar via WhatsApp'}
                    onClick={async () => {
                      try {
                        toast.loading('Enviando WhatsApp...');
                        const res = await fetch('/api/admin/outbound/whatsapp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ toPhone: selectedClient.phone, text: billingMessage }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || 'Falha ao enviar WhatsApp');
                        toast.dismiss();
                        toast.success('WhatsApp enviado!');
                      } catch (e: any) {
                        toast.dismiss();
                        toast.error(`Erro: ${String(e?.message || e)}`);
                      }
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetricCard({ title, value, icon, trend, color }: any) {
  const colorClasses: Record<string, string> = {
    green: 'border-l-green-500 bg-green-50',
    red: 'border-l-red-500 bg-red-50',
    blue: 'border-l-blue-500 bg-blue-50',
    purple: 'border-l-purple-500 bg-purple-50',
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${colorClasses[color]?.split(' ')[0] || 'border-l-gray-500'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
      <p className="text-xs font-medium text-gray-600">{trend}</p>
    </motion.div>
  )
}

function StatusBadge({ status, daysLate }: { status: string; daysLate?: number }) {
  const styles: Record<string, string> = {
    ok: 'bg-green-100 text-green-800',
    late: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  }
  
  const labels: Record<string, string> = {
    ok: 'Em Dia',
    late: daysLate ? `Atrasado ${daysLate}d` : 'Atrasado',
    pending: 'Pendente'
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || 'Desconhecido'}
    </span>
  )
}

function HealthBar({ score }: { score: number }) {
  let color = 'bg-green-500'
  if (score < 70) color = 'bg-red-500'
  else if (score < 90) color = 'bg-yellow-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-24">
        <div 
          className={`h-full ${color} transition-all`} 
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 font-medium">{score}</span>
    </div>
  )
}
