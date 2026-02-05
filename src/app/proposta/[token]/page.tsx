'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Check, X, FileText, DollarSign, Calendar,
  Clock, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, Building2, Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

interface Proposal {
  client_name: string
  services: Array<{
    name: string
    description?: string
    price: number
    quantity: number
    features?: string[]
  }>
  subtotal: number
  discount_percent: number
  discount_value: number
  total: number
  payment_terms: string
  valid_until: string
  notes: string
  status: string
}

export default function PropostaPage() {
  const params = useParams()
  const token = params.token as string
  
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [actionCompleted, setActionCompleted] = useState<'accepted' | 'rejected' | null>(null)

  useEffect(() => {
    if (token) {
      fetchProposal()
    }
  }, [token])

  const fetchProposal = async () => {
    try {
      const response = await fetch('/api/proposals/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ magic_link_token: token, action: 'view' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar proposta')
      }

      setProposal(data.proposal)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/proposals/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ magic_link_token: token, action: 'accept' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aceitar proposta')
      }

      setActionCompleted('accepted')
      toast.success('Proposta aceita com sucesso!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/proposals/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          magic_link_token: token, 
          action: 'reject',
          rejection_reason: rejectionReason 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao rejeitar proposta')
      }

      setActionCompleted('rejected')
      setShowRejectModal(false)
      toast.success('Proposta rejeitada')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (actionCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center"
        >
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
            actionCompleted === 'accepted' ? "bg-green-100" : "bg-gray-100"
          )}>
            {actionCompleted === 'accepted' ? (
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            ) : (
              <XCircle className="w-10 h-10 text-gray-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {actionCompleted === 'accepted' ? 'Proposta Aceita!' : 'Proposta Recusada'}
          </h1>
          <p className="text-gray-600 mb-6">
            {actionCompleted === 'accepted' 
              ? 'Em breve você receberá o contrato para assinatura. Obrigado pela confiança!'
              : 'Agradecemos seu tempo. Se tiver dúvidas, entre em contato conosco.'}
          </p>
          {actionCompleted === 'accepted' && (
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-700">
                <strong>Próximo passo:</strong> Nosso time jurídico irá preparar o contrato e enviar para você.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  if (!proposal) return null

  const isExpired = new Date(proposal.valid_until) < new Date()
  const isProcessed = ['accepted', 'rejected', 'expired'].includes(proposal.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Proposta Comercial</h1>
          <p className="text-gray-600">Olá, {proposal.client_name}!</p>
        </motion.div>

        {/* Status Banner */}
        {(isExpired || isProcessed) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "p-4 rounded-xl mb-6 text-center",
              proposal.status === 'accepted' ? "bg-green-100 text-green-700" :
              proposal.status === 'rejected' ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            )}
          >
            {proposal.status === 'accepted' && '✓ Esta proposta foi aceita'}
            {proposal.status === 'rejected' && '✗ Esta proposta foi rejeitada'}
            {proposal.status === 'expired' && '⚠ Esta proposta expirou'}
            {isExpired && proposal.status === 'sent' && '⚠ Esta proposta expirou'}
          </motion.div>
        )}

        {/* Proposal Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Validity */}
          <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Válida até {format(new Date(proposal.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            {!isExpired && !isProcessed && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                Válida
              </span>
            )}
          </div>

          {/* Services */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Serviços Inclusos</h2>
            <div className="space-y-4">
              {proposal.services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-4 border rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-500">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {(service.price * service.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      {service.quantity > 1 && (
                        <p className="text-xs text-gray-500">
                          {service.quantity}x {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      )}
                    </div>
                  </div>
                  {service.features && service.features.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {service.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{proposal.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              {proposal.discount_percent > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Desconto ({proposal.discount_percent}%)</span>
                  <span>-{proposal.discount_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                <span>Total</span>
                <span>{proposal.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>

            {/* Payment Terms */}
            {proposal.payment_terms && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-blue-800 mb-2">Condições de Pagamento</h3>
                <p className="text-sm text-blue-700">{proposal.payment_terms}</p>
              </div>
            )}

            {/* Notes */}
            {proposal.notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-2">Observações</h3>
                <p className="text-sm text-gray-600">{proposal.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isExpired && !isProcessed && (
            <div className="p-6 bg-gray-50 border-t">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Recusar
                </button>
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Aceitar Proposta
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-4">
                Ao aceitar, você concorda com os termos apresentados. O contrato será enviado para assinatura.
              </p>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Dúvidas? Entre em contato conosco.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <a href="mailto:contato@valle360.com" className="flex items-center gap-1 hover:text-blue-600">
              <Mail className="w-4 h-4" />
              contato@valle360.com
            </a>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recusar Proposta</h2>
            <p className="text-gray-600 mb-4">
              Poderia nos informar o motivo? Isso nos ajuda a melhorar.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Motivo da recusa (opcional)"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
