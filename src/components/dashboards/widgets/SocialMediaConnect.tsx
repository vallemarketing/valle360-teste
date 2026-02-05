'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Instagram, Facebook, Youtube, Linkedin, Plus, AlertCircle, X } from 'lucide-react'

interface SocialAccount {
  id: string
  platform: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'tiktok'
  username: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync: string
}

export default function SocialMediaConnect() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { id: '1', platform: 'instagram', username: '@valle360', status: 'connected', lastSync: 'Há 5 min' },
    { id: '2', platform: 'facebook', username: 'Valle 360 Agency', status: 'connected', lastSync: 'Há 10 min' },
    { id: '3', platform: 'linkedin', username: 'Valle 360', status: 'error', lastSync: 'Há 2 dias' }
  ])

  const [showModal, setShowModal] = useState(false)

  const getIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-600" />
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-600" />
      case 'youtube': return <Youtube className="w-5 h-5 text-red-600" />
      case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-700" />
      default: return <div className="w-5 h-5 bg-gray-400 rounded-full" />
    }
  }

  const handleConnect = (platform: string) => {
    // Simulação de conexão
    const newAccount: SocialAccount = {
      id: Math.random().toString(),
      platform: platform as any,
      username: '@novo_perfil',
      status: 'connected',
      lastSync: 'Agora'
    }
    setAccounts([...accounts, newAccount])
    setShowModal(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🔗 Contas Conectadas</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105"
          style={{ backgroundColor: '#E1306C' }}
        >
          <Plus className="w-4 h-4" />
          Conectar Conta
        </button>
      </div>

      <div className="space-y-4">
        {accounts.map((account) => (
          <div 
            key={account.id} 
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                {getIcon(account.platform)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{account.username}</p>
                <p className="text-xs text-gray-500 capitalize">{account.platform}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:block">
                Sincronizado: {account.lastSync}
              </span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                account.status === 'connected' ? 'bg-green-100 text-green-700' :
                account.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  account.status === 'connected' ? 'bg-green-500' :
                  account.status === 'error' ? 'bg-red-500' :
                  'bg-gray-500'
                }`} />
                {account.status === 'connected' ? 'Ativo' : 
                 account.status === 'error' ? 'Erro' : 'Desconectado'}
              </div>
              {account.status === 'error' && (
                <button className="p-1 hover:bg-red-50 rounded-full text-red-500" title="Reconectar">
                  <AlertCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Conexão */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Conectar Nova Conta</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleConnect('instagram')}
                  className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-pink-50 hover:border-pink-200 transition-all"
                >
                  <Instagram className="w-8 h-8 text-pink-600" />
                  <span className="text-sm font-medium text-gray-700">Instagram</span>
                </button>

                <button
                  onClick={() => handleConnect('facebook')}
                  className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  <Facebook className="w-8 h-8 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Facebook</span>
                </button>

                <button
                  onClick={() => handleConnect('linkedin')}
                  className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  <Linkedin className="w-8 h-8 text-blue-700" />
                  <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                </button>

                <button
                  onClick={() => handleConnect('youtube')}
                  className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-red-50 hover:border-red-200 transition-all"
                >
                  <Youtube className="w-8 h-8 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">YouTube</span>
                </button>
              </div>

              <div className="p-4 bg-gray-50 text-center">
                <p className="text-xs text-gray-500">
                  Ao conectar, você permite que a Valle 360 acesse métricas públicas.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
