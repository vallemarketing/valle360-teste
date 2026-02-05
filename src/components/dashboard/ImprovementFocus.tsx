'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Award, AlertCircle, BookOpen, Target, ArrowUp } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type ImprovementFocus = {
  id: string
  title: string
  description: string
  type: 'course' | 'action' | 'alert'
  priority: 'high' | 'medium'
  link?: string
}

export function ImprovementFocus() {
  const [metrics, setMetrics] = useState({
    nps: 0,
    delayedTasks: 0,
    efficiency: 0,
    xp: 0
  })
  const [focusItems, setFocusItems] = useState<ImprovementFocus[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Simular carregamento de métricas (idealmente viria de um endpoint /api/colaborador/metrics)
    // Lógica: Se NPS < 70 ou Tarefas Atrasadas > 3, sugerir melhorias
    const loadMetrics = async () => {
        // Mock
        const mockMetrics = {
            nps: 65, // Detrator/Neutro - Gera alerta
            delayedTasks: 4, // Gera alerta
            efficiency: 82,
            xp: 1250
        }
        setMetrics(mockMetrics)

        const suggestions: ImprovementFocus[] = []

        if (mockMetrics.nps < 75) {
            suggestions.push({
                id: '1',
                title: 'Melhorar Comunicação com Cliente',
                description: 'Seu NPS recente indica oportunidades de melhoria no atendimento.',
                type: 'course',
                priority: 'high',
                link: '/academy/comunicacao-assertiva'
            })
        }

        if (mockMetrics.delayedTasks > 2) {
            suggestions.push({
                id: '2',
                title: 'Gestão de Tempo e Prazos',
                description: 'Você tem tarefas atrasadas recorrentes. Vamos otimizar sua agenda?',
                type: 'action',
                priority: 'high',
                link: '/ferramentas/gestao-tempo'
            })
        }

        if (mockMetrics.efficiency < 85) {
             suggestions.push({
                id: '3',
                title: 'Fluxo de Trabalho Ágil',
                description: 'Dica rápida: Use templates para acelerar suas entregas em 20%.',
                type: 'alert',
                priority: 'medium'
            })
        }

        setFocusItems(suggestions)
    }

    loadMetrics()
  }, [])

  if (focusItems.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-amber-50 to-pink-50 rounded-xl p-6 border border-amber-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg text-primary">
          <Target size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Foco de Melhoria Semanal</h3>
          <p className="text-xs text-gray-500">Baseado na sua performance recente</p>
        </div>
      </div>

      <div className="space-y-3">
        {focusItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex gap-4 transition-transform hover:scale-[1.02] cursor-pointer">
            <div className={`w-1 h-full rounded-full ${item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm text-gray-800">{item.title}</h4>
                    {item.type === 'course' && <BookOpen size={16} className="text-blue-500" />}
                    {item.type === 'action' && <ArrowUp size={16} className="text-green-500" />}
                    {item.type === 'alert' && <AlertCircle size={16} className="text-primary" />}
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.description}</p>
                {item.link && (
                    <span className="text-xs font-medium text-primary mt-2 block hover:underline">
                        Começar agora →
                    </span>
                )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-amber-200/50 flex justify-between items-center">
        <span className="text-xs font-medium text-gray-600">Seu XP atual: <span className="text-primary">{metrics.xp}</span></span>
        <span className="text-xs text-gray-400">Próximo nível: 1500 XP</span>
      </div>
    </div>
  )
}

