'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  RotateCcw,
  TrendingUp,
  Target,
  Users,
  Heart,
  Info
} from 'lucide-react'

interface GamificationRule {
  id: string
  rule_name: string
  rule_type: 'productivity' | 'quality' | 'collaboration' | 'wellbeing'
  points_value: number
  description: string
  is_active: boolean
}

export default function RegrasGamificacaoPage() {
  const [rules, setRules] = useState<GamificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [globalSettings, setGlobalSettings] = useState({
    level_multiplier: 100, // pontos por nível
    max_level: 50,
    daily_bonus: 5,
    weekly_bonus: 25,
    monthly_bonus: 100
  })

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_rules')
        .select('*')
        .order('rule_type', { ascending: true })

      if (error) throw error
      
      if (data && data.length > 0) {
        setRules(data)
      } else {
        // Criar regras padrão se não existirem
        await createDefaultRules()
      }
    } catch (error) {
      console.error('Erro ao carregar regras:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultRules = async () => {
    const defaultRules = [
      // Produtividade
      { rule_name: 'Tarefa Concluída', rule_type: 'productivity', points_value: 10, description: 'Completar uma tarefa atribuída', is_active: true },
      { rule_name: 'Tarefa Urgente Concluída', rule_type: 'productivity', points_value: 25, description: 'Completar uma tarefa marcada como urgente', is_active: true },
      { rule_name: 'Entrega no Prazo', rule_type: 'productivity', points_value: 15, description: 'Entregar tarefa dentro do prazo', is_active: true },
      { rule_name: 'Entrega Antecipada', rule_type: 'productivity', points_value: 30, description: 'Entregar tarefa antes do prazo', is_active: true },
      { rule_name: 'Meta Diária Alcançada', rule_type: 'productivity', points_value: 20, description: 'Completar todas as tarefas do dia', is_active: true },
      
      // Qualidade
      { rule_name: 'Aprovação Cliente', rule_type: 'quality', points_value: 50, description: 'Ter trabalho aprovado pelo cliente na primeira revisão', is_active: true },
      { rule_name: 'Feedback Positivo', rule_type: 'quality', points_value: 40, description: 'Receber feedback positivo de líder ou cliente', is_active: true },
      { rule_name: 'Sem Retrabalho', rule_type: 'quality', points_value: 30, description: 'Completar tarefa sem necessidade de correções', is_active: true },
      { rule_name: 'Inovação Implementada', rule_type: 'quality', points_value: 100, description: 'Sugerir e implementar uma melhoria no processo', is_active: true },
      
      // Colaboração
      { rule_name: 'Ajuda a Colega', rule_type: 'collaboration', points_value: 15, description: 'Ajudar outro colaborador em uma tarefa', is_active: true },
      { rule_name: 'Participação em Reunião', rule_type: 'collaboration', points_value: 10, description: 'Participar ativamente de reunião de equipe', is_active: true },
      { rule_name: 'Mentoria', rule_type: 'collaboration', points_value: 50, description: 'Mentorar um novo colaborador', is_active: true },
      { rule_name: 'Compartilhamento de Conhecimento', rule_type: 'collaboration', points_value: 25, description: 'Criar documentação ou tutorial para a equipe', is_active: true },
      { rule_name: 'Feedback Construtivo', rule_type: 'collaboration', points_value: 20, description: 'Dar feedback construtivo a colegas', is_active: true },
      
      // Bem-estar
      { rule_name: 'Check-in Diário', rule_type: 'wellbeing', points_value: 5, description: 'Fazer check-in diário no sistema', is_active: true },
      { rule_name: 'Resposta a Val', rule_type: 'wellbeing', points_value: 5, description: 'Responder quebra-gelo da Val', is_active: true },
      { rule_name: 'Sequência de 7 Dias', rule_type: 'wellbeing', points_value: 50, description: 'Manter sequência de atividade por 7 dias', is_active: true },
      { rule_name: 'Sequência de 30 Dias', rule_type: 'wellbeing', points_value: 200, description: 'Manter sequência de atividade por 30 dias', is_active: true },
      { rule_name: 'Perfil Completo', rule_type: 'wellbeing', points_value: 25, description: 'Completar todas as informações do perfil', is_active: true }
    ]

    try {
      const { data, error } = await supabase
        .from('gamification_rules')
        .insert(defaultRules)
        .select()

      if (error) throw error
      setRules(data)
    } catch (error) {
      console.error('Erro ao criar regras padrão:', error)
    }
  }

  const updateRule = (ruleId: string, field: keyof GamificationRule, value: any) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, [field]: value } : rule
    ))
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      const updates = rules.map(rule => 
        supabase
          .from('gamification_rules')
          .update({
            points_value: rule.points_value,
            is_active: rule.is_active
          })
          .eq('id', rule.id)
      )

      await Promise.all(updates)
      toast.success('Regras atualizadas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar regras:', error)
      toast.error(error?.message || 'Erro ao salvar regras')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('Tem certeza que deseja restaurar as configurações padrão?')) return
    
    try {
      await supabase.from('gamification_rules').delete().neq('id', '')
      await createDefaultRules()
      toast.success('Regras restauradas para o padrão!')
    } catch (error: any) {
      console.error('Erro ao resetar regras:', error)
      toast.error(error?.message || 'Erro ao restaurar regras')
    }
  }

  const getRuleTypeInfo = (type: string) => {
    const types = {
      productivity: { 
        label: 'Produtividade', 
        icon: TrendingUp, 
        color: '#3B82F6',
        description: 'Pontos baseados em conclusão e eficiência de tarefas'
      },
      quality: { 
        label: 'Qualidade', 
        icon: Target, 
        color: '#10B981',
        description: 'Pontos baseados na excelência do trabalho entregue'
      },
      collaboration: { 
        label: 'Colaboração', 
        icon: Users, 
        color: '#8B5CF6',
        description: 'Pontos baseados em trabalho em equipe e ajuda mútua'
      },
      wellbeing: { 
        label: 'Bem-estar', 
        icon: Heart, 
        color: '#EF4444',
        description: 'Pontos baseados em engajamento e consistência'
      }
    }
    return types[type as keyof typeof types]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--primary-500)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Carregando regras...</p>
        </div>
      </div>
    )
  }

  const rulesByType = {
    productivity: rules.filter(r => r.rule_type === 'productivity'),
    quality: rules.filter(r => r.rule_type === 'quality'),
    collaboration: rules.filter(r => r.rule_type === 'collaboration'),
    wellbeing: rules.filter(r => r.rule_type === 'wellbeing')
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              ⚙️ Regras de Pontuação
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Configure como os colaboradores ganham pontos no sistema de gamificação
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrão
            </button>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-500)' }}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div 
          className="mb-8 p-4 rounded-xl flex items-start gap-3"
          style={{ 
            backgroundColor: 'var(--primary-50)',
            borderLeft: '4px solid var(--primary-500)'
          }}
        >
          <Info className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary-600)' }} />
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--primary-900)' }}>
              Como funciona a pontuação?
            </p>
            <p className="text-sm" style={{ color: 'var(--primary-700)' }}>
              As pontuações são calculadas automaticamente com base nas ações dos colaboradores. 
              Você pode ajustar o valor de pontos de cada ação e ativar/desativar regras específicas.
            </p>
          </div>
        </div>

        {/* Rules by Type */}
        <div className="space-y-6">
          {Object.entries(rulesByType).map(([type, typeRules]) => {
            const typeInfo = getRuleTypeInfo(type)
            const IconComponent = typeInfo.icon
            
            return (
              <motion.section
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${typeInfo.color}20` }}
                  >
                    <IconComponent className="w-6 h-6" style={{ color: typeInfo.color }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {typeInfo.label}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {typeInfo.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: typeInfo.color }}>
                      {typeRules.filter(r => r.is_active).length}/{typeRules.length}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Regras Ativas
                    </p>
                  </div>
                </div>

                {/* Rules Table */}
                <div className="space-y-3">
                  {typeRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        !rule.is_active ? 'opacity-50' : ''
                      }`}
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)'
                      }}
                    >
                      {/* Toggle */}
                      <button
                        onClick={() => updateRule(rule.id, 'is_active', !rule.is_active)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          rule.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            rule.is_active ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </button>

                      {/* Rule Info */}
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                          {rule.rule_name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {rule.description}
                        </p>
                      </div>

                      {/* Points Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={rule.points_value}
                          onChange={(e) => updateRule(rule.id, 'points_value', parseInt(e.target.value) || 0)}
                          disabled={!rule.is_active}
                          className="w-20 px-3 py-2 rounded-lg border text-center font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--border-light)',
                            color: typeInfo.color
                          }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )
          })}
        </div>

        {/* Global Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-2xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary-100)' }}
            >
              <Settings className="w-6 h-6" style={{ color: 'var(--primary-600)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Configurações Globais
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Ajuste configurações gerais do sistema de níveis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Pontos por Nível
              </label>
              <input
                type="number"
                value={globalSettings.level_multiplier}
                onChange={(e) => setGlobalSettings({ ...globalSettings, level_multiplier: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Ex: 100 pontos = Nível 1
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Nível Máximo
              </label>
              <input
                type="number"
                value={globalSettings.max_level}
                onChange={(e) => setGlobalSettings({ ...globalSettings, max_level: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Bônus Diário
              </label>
              <input
                type="number"
                value={globalSettings.daily_bonus}
                onChange={(e) => setGlobalSettings({ ...globalSettings, daily_bonus: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}



