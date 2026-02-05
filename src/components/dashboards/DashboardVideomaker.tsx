'use client'

import { Video, Play, CheckCircle, Clock, Sparkles } from 'lucide-react'
import TrendAlert from './widgets/TrendAlert'

export default function DashboardVideomaker() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">🎬 Videomaker - Pipeline de Produção</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#FF0000' }}>
          <p className="text-sm text-gray-600">Projetos Ativos</p>
          <p className="text-3xl font-bold text-gray-900">19</p>
          <p className="text-sm" style={{ color: '#FF0000' }}>🎥 Em produção</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#F59E0B' }}>
          <p className="text-sm text-gray-600">Gravações Agendadas</p>
          <p className="text-3xl font-bold text-gray-900">8</p>
          <p className="text-sm" style={{ color: '#F59E0B' }}>📅 Próximas</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#3B82F6' }}>
          <p className="text-sm text-gray-600">Em Edição</p>
          <p className="text-3xl font-bold text-gray-900">7</p>
          <p className="text-sm" style={{ color: '#3B82F6' }}>✂️ Editando</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#10B981' }}>
          <p className="text-sm text-gray-600">Entregues</p>
          <p className="text-3xl font-bold text-gray-900">12</p>
          <p className="text-sm" style={{ color: '#10B981' }}>✅ Este mês</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vídeos em Produção (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎬 Pipeline de Vídeos</h3>
          <div className="space-y-3">
            {[
              { title: 'Vídeo Institucional - Cliente ABC', stage: 'Edição', progress: 75, priority: 'alta' },
              { title: 'Depoimento Cliente - XYZ', stage: 'Gravação', progress: 30, priority: 'media' },
              { title: 'Motion Graphics - Campanha', stage: 'Roteiro', progress: 15, priority: 'baixa' }
            ].map((video, i) => (
              <div key={i} className="p-4 border rounded-lg hover:bg-red-50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      {video.title}
                    </p>
                    <p className="text-sm text-gray-600">Etapa: {video.stage}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    video.priority === 'alta' ? 'bg-red-100 text-red-700' :
                    video.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {video.priority}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${video.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{video.progress}%</span>
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
      <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border-2 border-red-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Insights da Val para Vídeo</h3>
            <p className="text-sm text-gray-700 mb-4">
              🎥 Tendência: Vídeos curtos (até 60s) estão gerando 3x mais engajamento. Considere adaptar seu conteúdo para Reels e TikTok.
            </p>
            <button className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105" style={{ backgroundColor: '#FF0000' }}>
              <Sparkles className="w-4 h-4 inline mr-2" />
              Ver Mais Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
