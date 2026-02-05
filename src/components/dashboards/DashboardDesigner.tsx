'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Sparkles,
  X,
  FileText,
  Inbox,
  AlertCircle
} from 'lucide-react'
import TrendAlert from './widgets/TrendAlert'

interface Project {
  id: string
  title: string
  type: string
  status: string
  deadline: string
  priority: string
  client: string
}

export default function DashboardDesigner() {
  const [projects] = useState<Project[]>([
    {
      id: '1',
      title: 'Banner Campanha Verão',
      type: 'banner',
      status: 'em_criacao',
      deadline: '2025-11-20',
      priority: 'alta',
      client: 'Cliente ABC'
    },
    {
      id: '2',
      title: 'Post Instagram - Lançamento',
      type: 'post',
      status: 'revisao',
      deadline: '2025-11-19',
      priority: 'alta',
      client: 'Cliente XYZ'
    },
    {
      id: '3',
      title: 'Logo Nova Marca',
      type: 'logo',
      status: 'aprovacao',
      deadline: '2025-11-25',
      priority: 'media',
      client: 'Cliente 123'
    }
  ])

  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showModal, setShowModal] = useState(false)

  const activeBriefings = projects.filter(p => p.status !== 'concluido')
  const inProduction = projects.filter(p => p.status === 'em_criacao')
  const inApproval = projects.filter(p => p.status === 'aprovacao')
  const totalAssets = 342

  const openModal = (projectList: Project[]) => {
    if (projectList.length > 0) {
      setSelectedProject(projectList[0])
      setShowModal(true)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">🎨 Designer Gráfico - Briefings</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div 
          onClick={() => openModal(activeBriefings)}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 cursor-pointer hover:shadow-lg transition-all" 
          style={{ borderColor: '#7B68EE' }}
        >
          <p className="text-sm text-gray-600">Briefings Ativos</p>
          <p className="text-3xl font-bold text-gray-900">{activeBriefings.length}</p>
          <p className="text-sm" style={{ color: '#7B68EE' }}>📊 Projetos em aberto</p>
        </div>

        <div 
          onClick={() => openModal(inProduction)}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 cursor-pointer hover:shadow-lg transition-all" 
          style={{ borderColor: '#F59E0B' }}
        >
          <p className="text-sm text-gray-600">Em Produção</p>
          <p className="text-3xl font-bold text-gray-900">{inProduction.length}</p>
          <p className="text-sm" style={{ color: '#F59E0B' }}>🎨 Criando agora</p>
        </div>

        <div 
          onClick={() => openModal(inApproval)}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 cursor-pointer hover:shadow-lg transition-all" 
          style={{ borderColor: '#3B82F6' }}
        >
          <p className="text-sm text-gray-600">Em Aprovação</p>
          <p className="text-3xl font-bold text-gray-900">{inApproval.length}</p>
          <p className="text-sm" style={{ color: '#3B82F6' }}>✅ Aguardando feedback</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#10B981' }}>
          <p className="text-sm text-gray-600">Assets Criados</p>
          <p className="text-3xl font-bold text-gray-900">{totalAssets}</p>
          <p className="text-sm" style={{ color: '#10B981' }}>📦 Total do mês</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projetos Recentes (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📋 Projetos Recentes</h3>
            <button 
              className="text-sm px-4 py-2 rounded-lg transition-all text-white"
              style={{ backgroundColor: '#7B68EE' }}
            >
              Ver Todos
            </button>
          </div>
          
          <div className="space-y-3">
            {projects.map((project) => (
              <div 
                key={project.id}
                onClick={() => {
                  setSelectedProject(project)
                  setShowModal(true)
                }}
                className="p-4 border rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                    <p className="text-sm text-gray-600">{project.client}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.priority === 'alta' ? 'bg-red-100 text-red-700' :
                      project.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {project.priority}
                    </span>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(project.deadline).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Alert (1/3 width) */}
        <div className="lg:col-span-1">
          <TrendAlert />
        </div>
      </div>

      {/* Insights da Val */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Insights da Val para Design</h3>
            <p className="text-sm text-gray-700 mb-4">
              🎨 Alerta de Gargalo: A etapa de 'Aprovação' está demorando 3 dias a mais que a média. Sugiro enviar lembretes automáticos aos clientes ou marcar uma reunião de alinhamento.
            </p>
            <p className="text-sm text-gray-700 mb-4 font-medium">
              💡 Prioridade do Dia: O projeto "Banner Campanha Verão" tem o maior impacto financeiro e vence amanhã. Foque nele primeiro!
            </p>
            <button 
              className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105"
              style={{ backgroundColor: '#7B68EE' }}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Otimizar Fluxo
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {showModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-900">{selectedProject.title}</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cliente</p>
                  <p className="font-medium text-gray-900">{selectedProject.client}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo</p>
                  <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                    {selectedProject.type}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedProject.status === 'em_criacao' ? 'bg-blue-100 text-blue-700' :
                    selectedProject.status === 'revisao' ? 'bg-yellow-100 text-yellow-700' :
                    selectedProject.status === 'aprovacao' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedProject.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Prazo</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedProject.deadline).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Prioridade</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedProject.priority === 'alta' ? 'bg-red-100 text-red-700' :
                    selectedProject.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedProject.priority}
                  </span>
                </div>
              </div>
              
              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button 
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-all"
                  style={{ backgroundColor: '#7B68EE' }}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Ver Briefing
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all"
                >
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
