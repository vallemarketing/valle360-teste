'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Star,
  Trophy,
  Medal,
  Target,
  Zap,
  Heart,
  TrendingUp,
  Users,
  CheckCircle2
} from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  criteria_type: 'points' | 'tasks' | 'streak' | 'custom'
  criteria_value: number
  is_active: boolean
  created_at: string
}

const iconOptions = [
  { value: 'Star', label: 'Estrela', component: Star },
  { value: 'Trophy', label: 'Troféu', component: Trophy },
  { value: 'Medal', label: 'Medalha', component: Medal },
  { value: 'Award', label: 'Prêmio', component: Award },
  { value: 'Target', label: 'Alvo', component: Target },
  { value: 'Zap', label: 'Raio', component: Zap },
  { value: 'Heart', label: 'Coração', component: Heart },
  { value: 'TrendingUp', label: 'Crescimento', component: TrendingUp },
  { value: 'Users', label: 'Equipe', component: Users },
  { value: 'CheckCircle2', label: 'Check', component: CheckCircle2 }
]

const colorOptions = [
  '#FFD700', // Gold
  '#C0C0C0', // Silver
  '#CD7F32', // Bronze
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Salmon
  '#98D8C8', // Mint
  '#A06CD5', // Purple
  '#F7DC6F'  // Yellow
]

export default function BadgesAdminPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Star',
    color: '#FFD700',
    criteria_type: 'points' as 'points' | 'tasks' | 'streak' | 'custom',
    criteria_value: 0,
    is_active: true
  })

  useEffect(() => {
    loadBadges()
  }, [])

  const loadBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_badges')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBadges(data || [])
    } catch (error) {
      console.error('Erro ao carregar badges:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingBadge(null)
    setFormData({
      name: '',
      description: '',
      icon: 'Star',
      color: '#FFD700',
      criteria_type: 'points',
      criteria_value: 0,
      is_active: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (badge: Badge) => {
    setEditingBadge(badge)
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      criteria_type: badge.criteria_type,
      criteria_value: badge.criteria_value,
      is_active: badge.is_active
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingBadge) {
        // Update
        const { error } = await supabase
          .from('gamification_badges')
          .update(formData)
          .eq('id', editingBadge.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('gamification_badges')
          .insert([formData])

        if (error) throw error
      }

      setIsModalOpen(false)
      loadBadges()
      toast.success(editingBadge ? 'Badge atualizada!' : 'Badge criada!')
    } catch (error: any) {
      console.error('Erro ao salvar badge:', error)
      toast.error(error?.message || 'Erro ao salvar badge')
    }
  }

  const handleDelete = async (badgeId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta badge?')) return

    try {
      const { error } = await supabase
        .from('gamification_badges')
        .delete()
        .eq('id', badgeId)

      if (error) throw error
      loadBadges()
      toast.success('Badge excluída!')
    } catch (error: any) {
      console.error('Erro ao excluir badge:', error)
      toast.error(error?.message || 'Erro ao excluir badge')
    }
  }

  const toggleActive = async (badge: Badge) => {
    try {
      const { error } = await supabase
        .from('gamification_badges')
        .update({ is_active: !badge.is_active })
        .eq('id', badge.id)

      if (error) throw error
      loadBadges()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const getIconComponent = (iconName: string) => {
    const icon = iconOptions.find(i => i.value === iconName)
    const IconComponent = icon?.component || Star
    return IconComponent
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--primary-500)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Carregando badges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              🏆 Gerenciar Badges
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Crie e gerencie as badges de gamificação do sistema
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            <Plus className="w-5 h-5" />
            Nova Badge
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total de Badges</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--primary-600)' }}>
              {badges.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Badges Ativas</p>
            <p className="text-3xl font-bold text-green-600">
              {badges.filter(b => b.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Badges Inativas</p>
            <p className="text-3xl font-bold text-gray-400">
              {badges.filter(b => !b.is_active).length}
            </p>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge, index) => {
            const IconComponent = getIconComponent(badge.icon)
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all hover:shadow-lg ${
                  !badge.is_active ? 'opacity-60' : ''
                }`}
                style={{ borderColor: badge.is_active ? badge.color : '#E5E7EB' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${badge.color}20` }}
                  >
                    <IconComponent className="w-7 h-7" style={{ color: badge.color }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(badge)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(badge.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {badge.name}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {badge.description}
                </p>

                {/* Criteria */}
                <div 
                  className="px-3 py-2 rounded-lg mb-4 text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Critério: {' '}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {badge.criteria_type === 'points' && `${badge.criteria_value} pontos`}
                    {badge.criteria_type === 'tasks' && `${badge.criteria_value} tarefas`}
                    {badge.criteria_type === 'streak' && `${badge.criteria_value} dias consecutivos`}
                    {badge.criteria_type === 'custom' && 'Personalizado'}
                  </span>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => toggleActive(badge)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    badge.is_active 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {badge.is_active ? 'Ativa' : 'Inativa'}
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {badges.length === 0 && (
          <div className="text-center py-16">
            <Award className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhuma badge criada ainda
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Clique em "Nova Badge" para criar sua primeira badge
            </p>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingBadge ? 'Editar Badge' : 'Nova Badge'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Nome da Badge *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Primeira Conquista"
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva como conquistar esta badge..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Ícone *
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {iconOptions.map((icon) => {
                      const IconComponent = icon.component
                      return (
                        <button
                          key={icon.value}
                          onClick={() => setFormData({ ...formData, icon: icon.value })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.icon === icon.value ? 'ring-2' : ''
                          }`}
                          style={{
                            borderColor: formData.icon === icon.value ? formData.color : 'var(--border-light)',
                            backgroundColor: formData.icon === icon.value ? `${formData.color}20` : 'var(--bg-secondary)'
                          }}
                        >
                          <IconComponent className="w-6 h-6 mx-auto" style={{ 
                            color: formData.icon === icon.value ? formData.color : 'var(--text-tertiary)' 
                          }} />
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            {icon.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Cor *
                  </label>
                  <div className="flex gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color ? 'ring-2 ring-offset-2' : ''
                        }`}
                        style={{
                          backgroundColor: color,
                          borderColor: formData.color === color ? color : 'transparent'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Criteria Type */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Tipo de Critério *
                  </label>
                  <select
                    value={formData.criteria_type}
                    onChange={(e) => setFormData({ ...formData, criteria_type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="points">Pontos Totais</option>
                    <option value="tasks">Tarefas Concluídas</option>
                    <option value="streak">Dias Consecutivos</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                {/* Criteria Value */}
                {formData.criteria_type !== 'custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Valor do Critério *
                    </label>
                    <input
                      type="number"
                      value={formData.criteria_value}
                      onChange={(e) => setFormData({ ...formData, criteria_value: parseInt(e.target.value) })}
                      placeholder="Ex: 100"
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                )}

                {/* Preview */}
                <div 
                  className="p-6 rounded-xl border-2"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: formData.color
                  }}
                >
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                    Pré-visualização:
                  </p>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(formData.icon)
                        return <IconComponent className="w-8 h-8" style={{ color: formData.color }} />
                      })()}
                    </div>
                    <div>
                      <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                        {formData.name || 'Nome da Badge'}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formData.description || 'Descrição da badge'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
                  style={{ backgroundColor: 'var(--primary-500)' }}
                >
                  {editingBadge ? 'Salvar Alterações' : 'Criar Badge'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



