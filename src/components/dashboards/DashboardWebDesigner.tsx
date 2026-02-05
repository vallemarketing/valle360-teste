'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Code, TrendingUp, Zap, X, ExternalLink, CheckSquare } from 'lucide-react'

interface Website {
  id: string
  name: string
  status: string
  tickets: number
  performance: number
}

export default function DashboardWebDesigner() {
  const [websites] = useState<Website[]>([
    { id: '1', name: 'Site E-commerce ABC', status: 'ativo', tickets: 3, performance: 94 },
    { id: '2', name: 'Landing Page XYZ', status: 'desenvolvimento', tickets: 5, performance: 88 },
    { id: '3', name: 'Portal Corporativo 123', status: 'manutencao', tickets: 2, performance: 91 }
  ])

  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null)
  const [showModal, setShowModal] = useState(false)

  const activeSites = websites.filter(w => w.status === 'ativo').length
  const openTickets = websites.reduce((acc, w) => acc + w.tickets, 0)
  const avgPerformance = Math.round(websites.reduce((acc, w) => acc + w.performance, 0) / websites.length)
  const totalDeploys = 34

  // Checklist IA Mock
  const [qaChecklist, setQaChecklist] = useState([
    { id: 1, text: 'Responsividade Mobile verificada?', checked: false },
    { id: 2, text: 'Tags SEO e Meta Descriptions?', checked: true },
    { id: 3, text: 'Velocidade de carregamento < 2s?', checked: false },
    { id: 4, text: 'Links quebrados validados?', checked: true },
  ])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">🌐 Web Designer - Projetos Web</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#4169E1' }}>
          <p className="text-sm text-gray-600">Sites Ativos</p>
          <p className="text-3xl font-bold text-gray-900">{activeSites}</p>
          <p className="text-sm" style={{ color: '#4169E1' }}>🌐 Em produção</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#F59E0B' }}>
          <p className="text-sm text-gray-600">Tickets Abertos</p>
          <p className="text-3xl font-bold text-gray-900">{openTickets}</p>
          <p className="text-sm" style={{ color: '#F59E0B' }}>📝 Aguardando</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#10B981' }}>
          <p className="text-sm text-gray-600">Performance</p>
          <p className="text-3xl font-bold text-gray-900">{avgPerformance}%</p>
          <p className="text-sm" style={{ color: '#10B981' }}>⚡ Média geral</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#8B5CF6' }}>
          <p className="text-sm text-gray-600">Deploys</p>
          <p className="text-3xl font-bold text-gray-900">{totalDeploys}</p>
          <p className="text-sm" style={{ color: '#8B5CF6' }}>🚀 Este mês</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sites (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💻 Sites em Gestão</h3>
          <div className="space-y-3">
            {websites.map((site) => (
              <div 
                key={site.id}
                onClick={() => {
                  setSelectedWebsite(site)
                  setShowModal(true)
                }}
                className="p-4 border rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {site.name}
                    </h4>
                    <p className="text-sm text-gray-600">Status: {site.status}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {site.tickets} tickets
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      {site.performance}% perf
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Quality Checklist (1/3 width) */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-100 h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Checklist QA da Val</h3>
              <p className="text-xs text-gray-500">Lembrete Inteligente Pré-Deploy</p>
            </div>
          </div>
          
          <div className="space-y-3 bg-white/50 p-4 rounded-xl backdrop-blur-sm">
            {qaChecklist.map(item => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${item.checked ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 group-hover:border-blue-400'}`}>
                  {item.checked && <CheckSquare className="w-3.5 h-3.5" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={item.checked}
                  onChange={() => setQaChecklist(qaChecklist.map(i => i.id === item.id ? {...i, checked: !i.checked} : i))}
                />
                <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
          
          <p className="text-xs text-blue-600 mt-4 italic">
            "Dica: Teste também em modo Dark Mode, detectei acessos crescendo nesse tema!"
          </p>
        </div>
      </div>

      {/* Insights da Val */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Insights da Val para Web</h3>
            <p className="text-sm text-gray-700 mb-4">
              ⚡ Otimização detectada: Seus sites estão com performance excelente! Considere implementar lazy loading para melhorar ainda mais.
            </p>
            <button className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105" style={{ backgroundColor: '#4169E1' }}>
              Ver Mais Insights
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && selectedWebsite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{selectedWebsite.name}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                    {selectedWebsite.status}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tickets Abertos</p>
                  <p className="font-medium text-gray-900">{selectedWebsite.tickets}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Performance</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${selectedWebsite.performance}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900">{selectedWebsite.performance}%</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button className="flex-1 px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#4169E1' }}>
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  Abrir Site
                </button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border hover:bg-gray-100">
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
