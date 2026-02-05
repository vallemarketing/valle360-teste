'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Search, 
  FileText, 
  Plus, 
  Send, 
  Link as LinkIcon, 
  Loader2, 
  Check, 
  Eye,
  Mail,
  Download,
  Building,
  User,
  Phone,
  DollarSign,
  X,
  Sparkles,
  Copy,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  name: string
  base_price: number
  description?: string
  deliverables: any
}

interface Proposal {
  id: string
  client_name: string
  client_email: string
  client_company?: string
  client_phone?: string
  total_value: number
  status: string
  magic_link_token: string
  created_at: string
  items: any[]
}

export default function ProposalGeneratorPage() {
  const [services, setServices] = useState<Service[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [clientData, setClientData] = useState({ 
    name: '', 
    email: '',
    company: '',
    phone: '',
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [generatedProposal, setGeneratedProposal] = useState<Proposal | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  
  const supabase = createClientComponentClient()

  // Mock services para demonstração
  const mockServices: Service[] = [
    { id: '1', name: 'Gestão de Redes Sociais', base_price: 2500, description: 'Gerenciamento completo de todas as redes', deliverables: {} },
    { id: '2', name: 'Tráfego Pago', base_price: 3500, description: 'Campanhas Meta Ads + Google Ads', deliverables: {} },
    { id: '3', name: 'Criação de Conteúdo', base_price: 2000, description: '20 posts mensais + stories', deliverables: {} },
    { id: '4', name: 'Design Gráfico', base_price: 1800, description: 'Artes personalizadas ilimitadas', deliverables: {} },
    { id: '5', name: 'Produção de Vídeo', base_price: 4500, description: '4 vídeos profissionais/mês', deliverables: {} },
    { id: '6', name: 'Email Marketing', base_price: 1500, description: 'Automações + newsletters', deliverables: {} },
    { id: '7', name: 'Consultoria Estratégica', base_price: 3000, description: 'Reuniões mensais + relatórios', deliverables: {} },
    { id: '8', name: 'Gestão TikTok', base_price: 2200, description: 'Conteúdo viral + trends', deliverables: {} },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [servicesRes, proposalsRes] = await Promise.all([
        supabase.from('services').select('*').eq('active', true),
        supabase.from('proposals').select('*').order('created_at', { ascending: false }).limit(10)
      ])

      if (servicesRes.data && servicesRes.data.length > 0) {
        setServices(servicesRes.data)
      } else {
        setServices(mockServices)
      }
      if (proposalsRes.data) setProposals(proposalsRes.data)
    } catch (error) {
      setServices(mockServices)
    }
    setIsLoading(false)
  }

  const toggleService = (service: Service) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id))
    } else {
      setSelectedServices([...selectedServices, service])
    }
  }

  const calculateTotal = () => {
    return selectedServices.reduce((acc, curr) => acc + curr.base_price, 0)
  }

  const generateProposal = async () => {
    if (!clientData.name || !clientData.email || selectedServices.length === 0) {
      toast.error('Preencha os dados do cliente e selecione serviços')
      return
    }

    setIsGenerating(true)
    const magicLinkToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    const proposalData = {
      client_name: clientData.name,
      client_email: clientData.email,
      client_company: clientData.company,
      client_phone: clientData.phone,
      total_value: calculateTotal(),
      status: 'draft',
      items: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.base_price, description: s.description })),
      magic_link_token: magicLinkToken,
      notes: clientData.notes
    }

    try {
      const { data, error } = await supabase.from('proposals').insert(proposalData).select().single()

      if (error) throw error
      
      setGeneratedProposal(data || { ...proposalData, id: Date.now().toString(), created_at: new Date().toISOString() })
      setShowSendModal(true)
      loadData()
    } catch (error) {
      // Modo demo sem banco
      setGeneratedProposal({ 
        ...proposalData, 
        id: Date.now().toString(), 
        created_at: new Date().toISOString() 
      } as Proposal)
      setShowSendModal(true)
    }
    setIsGenerating(false)
  }

  const sendProposalByEmail = async () => {
    if (!generatedProposal) return
    
    setSendingEmail(true)
    try {
      // Enviar via API
      const response = await fetch('/api/proposals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: generatedProposal.id,
          proposal_id: generatedProposal.id
        })
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const msg = data?.error || 'Falha ao enviar proposta'
        toast.error(msg)
        return
      }

      toast.success('✅ Proposta marcada como enviada!')
      if (data?.proposal_link) {
        try {
          await navigator.clipboard.writeText(data.proposal_link)
          toast.success('Link copiado para a área de transferência')
        } catch {
          // ignore
        }
      }
      
      setShowSendModal(false)
      setClientData({ name: '', email: '', company: '', phone: '', notes: '' })
      setSelectedServices([])
      setGeneratedProposal(null)
    } catch (error) {
      toast.error('Erro ao enviar proposta. Tente novamente.')
    }
    setSendingEmail(false)
  }

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/proposta/${token}`
    navigator.clipboard.writeText(link)
    toast.success('Link copiado!')
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'accepted':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Aceita</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Recusada</Badge>
      case 'sent':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Enviada</Badge>
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Rascunho</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#001533] dark:text-white mb-2">
                Gerador de Propostas
              </h1>
              <p className="text-[#001533]/60 dark:text-white/60">
                Crie e envie propostas comerciais profissionais
              </p>
            </div>
            <Badge className="bg-[#1672d6]/10 text-[#1672d6] border-[#1672d6]/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Template Valle 360
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal: Gerador */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Cliente */}
            <Card className="border-[#001533]/10 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-[#1672d6]" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[#001533]/70 dark:text-white/70">
                      Nome do Contato *
                    </label>
                    <Input 
                      value={clientData.name}
                      onChange={e => setClientData({...clientData, name: e.target.value})}
                      placeholder="João Silva"
                      className="border-[#001533]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[#001533]/70 dark:text-white/70">
                      Email *
                    </label>
                    <Input 
                      value={clientData.email}
                      onChange={e => setClientData({...clientData, email: e.target.value})}
                      placeholder="email@empresa.com"
                      type="email"
                      className="border-[#001533]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[#001533]/70 dark:text-white/70">
                      Empresa
                    </label>
                    <Input 
                      value={clientData.company}
                      onChange={e => setClientData({...clientData, company: e.target.value})}
                      placeholder="Nome da Empresa"
                      className="border-[#001533]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[#001533]/70 dark:text-white/70">
                      Telefone
                    </label>
                    <Input 
                      value={clientData.phone}
                      onChange={e => setClientData({...clientData, phone: e.target.value})}
                      placeholder="(11) 99999-0000"
                      className="border-[#001533]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[#001533]/70 dark:text-white/70">
                    Observações
                  </label>
                  <Textarea 
                    value={clientData.notes}
                    onChange={e => setClientData({...clientData, notes: e.target.value})}
                    placeholder="Informações adicionais sobre o cliente ou negociação..."
                    className="border-[#001533]/20 min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Serviços */}
            <Card className="border-[#001533]/10 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-[#1672d6]" />
                  Selecione os Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map(service => {
                    const isSelected = !!selectedServices.find(s => s.id === service.id)
                    return (
                      <motion.button 
                        key={service.id}
                        onClick={() => toggleService(service)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          isSelected 
                            ? "border-[#1672d6] bg-[#1672d6]/5" 
                            : "border-[#001533]/10 dark:border-white/10 hover:border-[#1672d6]/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-[#001533] dark:text-white">{service.name}</p>
                            <p className="text-xs text-[#001533]/50 dark:text-white/50 mt-0.5">{service.description}</p>
                          </div>
                          {isSelected && (
                            <div className="p-1 rounded-full bg-[#1672d6]">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-lg font-bold text-[#1672d6] mt-2">
                          R$ {service.base_price.toLocaleString('pt-BR')}
                          <span className="text-xs font-normal text-[#001533]/50 dark:text-white/50">/mês</span>
                        </p>
                      </motion.button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Resumo e Ações */}
            <Card className="border-2 border-[#1672d6]/30 bg-gradient-to-br from-[#1672d6]/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#001533]/60 dark:text-white/60">Valor Total Mensal</p>
                    <p className="text-4xl font-bold text-[#1672d6]">
                      R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-[#001533]/50 dark:text-white/50 mt-1">
                      {selectedServices.length} serviço(s) selecionado(s)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      disabled={selectedServices.length === 0}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Pré-visualizar
                    </Button>
                    <Button
                      onClick={generateProposal}
                      disabled={isGenerating || selectedServices.length === 0}
                      className="bg-[#1672d6] hover:bg-[#1260b5]"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Gerar Proposta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Histórico */}
          <div className="space-y-6">
            <Card className="border-[#001533]/10 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Últimas Propostas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposals.length > 0 ? proposals.map(prop => (
                  <motion.div 
                    key={prop.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-xl border border-[#001533]/10 dark:border-white/10 bg-[#001533]/5 dark:bg-white/5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-[#001533] dark:text-white">{prop.client_name}</p>
                        <p className="text-xs text-[#001533]/50 dark:text-white/50">{prop.client_company || prop.client_email}</p>
                      </div>
                      {getStatusBadge(prop.status)}
                    </div>
                    <p className="text-lg font-bold text-[#1672d6] mb-3">
                      R$ {prop.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(prop.magic_link_token)}
                        className="flex-1 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar Link
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1 text-xs bg-[#1672d6] hover:bg-[#1260b5]"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Reenviar
                      </Button>
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-sm text-[#001533]/40 dark:text-white/40 text-center py-8">
                    Nenhuma proposta gerada ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Envio */}
      <AnimatePresence>
        {showSendModal && generatedProposal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-lg shadow-2xl"
            >
              <div className="p-6 border-b border-[#001533]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#001533] dark:text-white">Proposta Gerada!</h2>
                    <p className="text-sm text-[#001533]/60 dark:text-white/60">Como deseja enviar para o cliente?</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Resumo */}
                <div className="p-4 rounded-xl bg-[#001533]/5 dark:bg-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#001533]/60 dark:text-white/60">Cliente</span>
                    <span className="font-medium">{clientData.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#001533]/60 dark:text-white/60">Email</span>
                    <span className="font-medium">{clientData.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#001533]/60 dark:text-white/60">Valor Total</span>
                    <span className="font-bold text-[#1672d6]">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => copyLink(generatedProposal.magic_link_token)}
                    className="h-auto py-4 flex-col"
                  >
                    <LinkIcon className="w-5 h-5 mb-2" />
                    <span className="text-sm font-medium">Copiar Link</span>
                    <span className="text-[10px] text-muted-foreground">Enviar manualmente</span>
                  </Button>
                  <Button
                    onClick={sendProposalByEmail}
                    disabled={sendingEmail}
                    className="h-auto py-4 flex-col bg-[#1672d6] hover:bg-[#1260b5]"
                  >
                    {sendingEmail ? (
                      <Loader2 className="w-5 h-5 mb-2 animate-spin" />
                    ) : (
                      <Mail className="w-5 h-5 mb-2" />
                    )}
                    <span className="text-sm font-medium">Enviar por Email</span>
                    <span className="text-[10px] text-white/70">Proposta profissional</span>
                  </Button>
                </div>

                <p className="text-xs text-center text-[#001533]/40 dark:text-white/40">
                  A proposta será enviada com o template oficial Valle 360, incluindo logo e dados da empresa.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
