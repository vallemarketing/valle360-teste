'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Copy, Check, Mail, Key, Globe, LogIn, 
  AlertTriangle, MessageCircle, CheckCircle2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CredentialsModalProps {
  isOpen: boolean
  onClose: () => void
  credentials: {
    email: string
    senha: string
    webmailUrl?: string
    loginUrl?: string
    emailDestino?: string
    mailtoUrl?: string
  }
  nome: string
  tipo?: 'colaborador' | 'cliente'
  emailEnviado?: boolean
  provider?: string
}

export function CredentialsModal({
  isOpen,
  onClose,
  credentials,
  nome,
  tipo = 'colaborador',
  emailEnviado = false,
  provider,
}: CredentialsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copiado!')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  const copyAllCredentials = async () => {
    const text = `
🔐 Credenciais de Acesso - Valle 360

Olá ${nome}! 👋

Aqui estão suas credenciais de acesso:

📧 Email: ${credentials.email}
🔑 Senha: ${credentials.senha}

🔗 Acessar Sistema: ${credentials.loginUrl || 'https://app.valle360.com.br/login'}
📬 Acessar Webmail: ${credentials.webmailUrl || 'https://webmail.vallegroup.com.br/'}

⚠️ Lembre-se de alterar sua senha no primeiro acesso!

Bem-vindo à Valle 360! 🚀
    `.trim()

    await copyToClipboard(text, 'all')
  }

  const sendViaWhatsApp = () => {
    const text = encodeURIComponent(`
🔐 *Credenciais de Acesso - Valle 360*

Olá ${nome}! 👋

Aqui estão suas credenciais de acesso:

📧 *Email:* ${credentials.email}
🔑 *Senha:* ${credentials.senha}

🔗 *Acessar Sistema:* ${credentials.loginUrl || 'https://app.valle360.com.br/login'}
📬 *Acessar Webmail:* ${credentials.webmailUrl || 'https://webmail.vallegroup.com.br/'}

⚠️ Lembre-se de alterar sua senha no primeiro acesso!

_Bem-vindo à Valle 360!_ 🚀
    `.trim())

    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const webmailUrl = credentials.webmailUrl || 'https://webmail.vallegroup.com.br/'
  const loginUrl = credentials.loginUrl || 'https://app.valle360.com.br/login'
  const mailtoUrl = credentials.mailtoUrl

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {/* Header */}
            <div 
              className="p-6 text-white"
              style={{ 
                background: emailEnviado 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emailEnviado ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <AlertTriangle className="w-8 h-8" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">
                      {emailEnviado ? 'Email Enviado!' : 'Credenciais Geradas'}
                    </h3>
                    <p className="text-sm opacity-90">
                      {emailEnviado 
                        ? `Enviado via ${provider || 'email'}` 
                        : 'Envie manualmente as credenciais'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p style={{ color: 'var(--text-secondary)' }}>
                {tipo === 'colaborador' ? 'Colaborador' : 'Cliente'}: <strong style={{ color: 'var(--text-primary)' }}>{nome}</strong>
              </p>

              {/* Campo Email */}
              <div className="rounded-xl p-4 border" style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Email</p>
                      <p className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                        {credentials.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Campo Senha */}
              <div className="rounded-xl p-4 border" style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Senha Provisória</p>
                      <p className="font-mono font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                        {credentials.senha}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.senha, 'senha')}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copiedField === 'senha' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <LogIn className="w-4 h-4 text-blue-500" />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Sistema</span>
                </a>
                <a
                  href={webmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <Globe className="w-4 h-4 text-purple-500" />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Webmail</span>
                </a>
              </div>

              {/* Aviso */}
              {!emailEnviado && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>⚠️ Atenção:</strong> O email não foi enviado automaticamente. 
                    Use os botões abaixo para copiar ou enviar via WhatsApp.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex flex-col gap-3" style={{ borderColor: 'var(--border-primary)' }}>
              {mailtoUrl && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.open(mailtoUrl, '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Abrir Email (mailto)
                </Button>
              )}
              <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyAllCredentials}
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Tudo
                  </>
                )}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={sendViaWhatsApp}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar WhatsApp
              </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
