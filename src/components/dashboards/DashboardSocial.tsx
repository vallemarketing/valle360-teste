'use client'

import { Heart, TrendingUp, MessageCircle, Share2, Sparkles } from 'lucide-react'
import SocialMediaConnect from './widgets/SocialMediaConnect'
import TrendAlert from './widgets/TrendAlert'

export default function DashboardSocial() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📱 Social Media - Calendário de Posts</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#E1306C' }}>
          <p className="text-sm text-gray-600">Posts Publicados</p>
          <p className="text-3xl font-bold text-gray-900">156</p>
          <p className="text-sm" style={{ color: '#E1306C' }}>↑ 15% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#10B981' }}>
          <p className="text-sm text-gray-600">Total de Likes</p>
          <p className="text-3xl font-bold text-gray-900">12.5k</p>
          <p className="text-sm" style={{ color: '#10B981' }}>↑ 23% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#3B82F6' }}>
          <p className="text-sm text-gray-600">Comentários</p>
          <p className="text-3xl font-bold text-gray-900">3.2k</p>
          <p className="text-sm" style={{ color: '#3B82F6' }}>↑ 8% vs mês anterior</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: '#F59E0B' }}>
          <p className="text-sm text-gray-600">Engajamento Médio</p>
          <p className="text-3xl font-bold text-gray-900">8.5%</p>
          <p className="text-sm" style={{ color: '#F59E0B' }}>↑ 12% vs mês anterior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts Recentes (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Posts Recentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">Canal</th>
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">Título</th>
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">Métricas</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { canal: 'Instagram', titulo: 'Promoção Black Friday', status: 'Publicado', likes: 850 },
                  { canal: 'Facebook', titulo: 'Novos Serviços 2025', status: 'Agendado', likes: 0 },
                  { canal: 'TikTok', titulo: 'Behind the Scenes', status: 'Publicado', likes: 1200 }
                ].map((post, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#E1306C20', color: '#E1306C' }}>
                        {post.canal}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-900">{post.titulo}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        post.status === 'Publicado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {post.likes > 0 ? `❤️ ${post.likes} 💬 ${Math.floor(post.likes * 0.15)} 🔄 ${Math.floor(post.likes * 0.08)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Social Connect (1/3 width) */}
        <div className="lg:col-span-1">
          <SocialMediaConnect />
        </div>
      </div>

      {/* Trend Alert - Full Width */}
      <TrendAlert />

      {/* Insights da Val */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-lg border-2 border-pink-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Insights da Val para Social Media</h3>
            <p className="text-sm text-gray-700 mb-4">
              📱 Seu engajamento está crescendo 12%! Posts publicados entre 18h-20h têm 40% mais curtidas. Ajuste seu calendário!
            </p>
            <button className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105" style={{ backgroundColor: '#E1306C' }}>
              <Sparkles className="w-4 h-4 inline mr-2" />
              Otimizar Calendário
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
