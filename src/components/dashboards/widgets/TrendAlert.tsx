'use client'

import { useState } from 'react'
import { TrendingUp, Sparkles, Video, Share2, ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TrendAlert() {
  const [loading, setLoading] = useState(false)
  const [trends, setTrends] = useState([
    {
      id: 1,
      title: 'POV: Day in the Life',
      platform: 'TikTok',
      growth: '+120%',
      description: 'Mostrar bastidores humanizados está gerando alto engajamento.',
      type: 'video'
    },
    {
      id: 2,
      title: 'Carrossel Educativo Minimalista',
      platform: 'Instagram',
      growth: '+85%',
      description: 'Design clean com tipografia grande e fundo neutro.',
      type: 'design'
    },
    {
      id: 3,
      title: 'Áudio: "Is it worth it?"',
      platform: 'Reels',
      growth: '+200%',
      description: 'Trend de transição ideal para mostrar resultados de serviços.',
      type: 'video'
    }
  ])

  const refreshTrends = () => {
    setLoading(true)
    // Simulação de chamada API
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-2xl border border-pink-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Trend Alert</h3>
            <p className="text-xs text-gray-500">O que está bombando agora</p>
          </div>
        </div>
        <button 
          onClick={refreshTrends}
          disabled={loading}
          className="p-2 hover:bg-pink-100 rounded-full transition-colors text-pink-600"
        >
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {trends.map((trend, index) => (
          <motion.div
            key={trend.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                trend.platform === 'TikTok' ? 'bg-black text-white' : 
                trend.platform === 'Instagram' || trend.platform === 'Reels' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 
                'bg-blue-500 text-white'
              }`}>
                {trend.platform}
              </span>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend.growth}
              </span>
            </div>
            
            <h4 className="font-bold text-gray-800 mb-1 group-hover:text-pink-600 transition-colors">
              {trend.title}
            </h4>
            <p className="text-sm text-gray-600 leading-snug mb-3">
              {trend.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {trend.type === 'video' ? <Video className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                {trend.type === 'video' ? 'Formato Vídeo' : 'Formato Estático'}
              </div>
              <button className="text-xs font-medium text-pink-600 flex items-center gap-1 hover:gap-2 transition-all">
                Usar Ideia <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

