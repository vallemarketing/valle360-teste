'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, MessageCircle, ArrowLeft, Shield, CheckCircle } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'method' | 'sent'>('email')
  const [email, setEmail] = useState('')
  const [method, setMethod] = useState<'email' | 'whatsapp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verificar se email existe
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, phone')
        .eq('email', email)
        .single()

      if (!userData) {
        setError('Email não encontrado no sistema')
        setLoading(false)
        return
      }

      setStep('method')
    } catch (err) {
      setError('Erro ao buscar usuário')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRecovery = async () => {
    setLoading(true)
    setError('')

    try {
      if (method === 'email') {
        // Enviar email de recuperação
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        })

        if (resetError) throw resetError

        // Registrar log
        await supabase.from('user_access_logs').insert({
          action: 'password_reset_requested',
          action_details: { method: 'email', email }
        })

      } else {
        // Enviar via WhatsApp
        // Gerar código temporário
        const tempCode = Math.floor(100000 + Math.random() * 900000).toString()

        // Salvar código no banco
        await supabase.from('password_reset_tokens').insert({
          email,
          token: tempCode,
          method: 'whatsapp',
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
        })

        // Enviar via WhatsApp (integração com API)
        // await sendWhatsAppMessage(phone, `Seu código de recuperação: ${tempCode}`)

        // Registrar log
        await supabase.from('user_access_logs').insert({
          action: 'password_reset_requested',
          action_details: { method: 'whatsapp', email }
        })
      }

      setStep('sent')
    } catch (err) {
      setError('Erro ao enviar código de recuperação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Animação de Fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Voltar */}
        <button
          onClick={() => step === 'email' ? router.push('/login') : setStep('email')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar</span>
        </button>

        {step === 'email' && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Recuperar Senha
              </h2>
              <p className="text-gray-400 text-sm">
                Digite seu email para recuperar o acesso
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmitEmail} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          </>
        )}

        {step === 'method' && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Escolha o Método
              </h2>
              <p className="text-gray-400 text-sm">
                Como deseja receber o código de recuperação?
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Option */}
              <button
                onClick={() => setMethod('email')}
                className={`w-full p-6 rounded-xl border-2 transition-all ${
                  method === 'email'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    method === 'email' ? 'bg-blue-500/20' : 'bg-gray-600'
                  }`}>
                    <Mail className={`w-6 h-6 ${method === 'email' ? 'text-blue-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white mb-1">Email</h3>
                    <p className="text-sm text-gray-400">
                      Receber link de recuperação por email
                    </p>
                  </div>
                  {method === 'email' && (
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  )}
                </div>
              </button>

              {/* WhatsApp Option */}
              <button
                onClick={() => setMethod('whatsapp')}
                className={`w-full p-6 rounded-xl border-2 transition-all ${
                  method === 'whatsapp'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    method === 'whatsapp' ? 'bg-green-500/20' : 'bg-gray-600'
                  }`}>
                    <MessageCircle className={`w-6 h-6 ${method === 'whatsapp' ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white mb-1">WhatsApp</h3>
                    <p className="text-sm text-gray-400">
                      Receber código via WhatsApp (mais rápido)
                    </p>
                  </div>
                  {method === 'whatsapp' && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                </div>
              </button>
            </div>

            <button
              onClick={handleSendRecovery}
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </>
        )}

        {step === 'sent' && (
          <>
            {/* Success */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Código Enviado!
              </h2>
              <p className="text-gray-400 mb-8">
                {method === 'email' 
                  ? `Enviamos um link de recuperação para ${email}. Verifique sua caixa de entrada (e spam).`
                  : `Enviamos um código de 6 dígitos via WhatsApp. O código expira em 15 minutos.`
                }
              </p>

              {method === 'email' ? (
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Voltar para Login
                </button>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/verificar-codigo')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all"
                  >
                    Inserir Código
                  </button>
                  <button
                    onClick={handleSendRecovery}
                    className="w-full text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Não recebeu? Reenviar código
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

