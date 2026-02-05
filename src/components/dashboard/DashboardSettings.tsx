'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Settings,
  X,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Award,
  MessageSquare,
  BarChart3,
  Activity,
  Image,
  Upload,
  Palette,
  Layout,
  Grid3X3,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  Move
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Widget {
  id: string
  type: string
  title: string
  icon: any
  color: string
  visible: boolean
  size: 'small' | 'medium' | 'large'
  order: number
}

interface DashboardSettingsProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSave: (settings: DashboardSettingsData) => void
}

export interface DashboardSettingsData {
  layout: Widget[]
  theme: 'light' | 'dark' | 'system'
  companyLogo?: string
  companyIcon?: string
  primaryColor?: string
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'tasks-active', type: 'tasks', title: 'Tarefas Ativas', icon: Clock, color: '#3B82F6', visible: true, size: 'medium', order: 0 },
  { id: 'tasks-completed', type: 'tasks', title: 'Tarefas Concluídas', icon: CheckCircle2, color: '#10B981', visible: true, size: 'medium', order: 1 },
  { id: 'metrics-productivity', type: 'metrics', title: 'Produtividade', icon: TrendingUp, color: '#8B5CF6', visible: true, size: 'medium', order: 2 },
  { id: 'metrics-quality', type: 'metrics', title: 'Qualidade', icon: Target, color: '#F59E0B', visible: true, size: 'medium', order: 3 },
  { id: 'calendar', type: 'calendar', title: 'Calendário', icon: Calendar, color: '#EC4899', visible: true, size: 'large', order: 4 },
  { id: 'gamification', type: 'gamification', title: 'Gamificação', icon: Award, color: '#FFD700', visible: true, size: 'medium', order: 5 },
  { id: 'messages', type: 'messages', title: 'Mensagens', icon: MessageSquare, color: '#06B6D4', visible: true, size: 'medium', order: 6 },
  { id: 'chart-performance', type: 'chart', title: 'Gráfico Desempenho', icon: BarChart3, color: '#6366F1', visible: true, size: 'large', order: 7 },
  { id: 'activity-feed', type: 'activity', title: 'Atividades Recentes', icon: Activity, color: '#EF4444', visible: true, size: 'large', order: 8 },
  { id: 'team', type: 'metrics', title: 'Minha Equipe', icon: Users, color: '#14B8A6', visible: false, size: 'medium', order: 9 },
  { id: 'val-ai', type: 'val', title: 'Val IA', icon: MessageSquare, color: '#4370d1', visible: true, size: 'medium', order: 10 },
  { id: 'notifications', type: 'notifications', title: 'Notificações', icon: Activity, color: '#EF4444', visible: false, size: 'small', order: 11 }
]

export function DashboardSettings({ userId, isOpen, onClose, onSave }: DashboardSettingsProps) {
  const [activeTab, setActiveTab] = useState<'widgets' | 'appearance' | 'branding'>('widgets')
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS)
  const [companyLogo, setCompanyLogo] = useState<string>('')
  const [companyIcon, setCompanyIcon] = useState<string>('')
  const [primaryColor, setPrimaryColor] = useState('#4370d1')
  const [saving, setSaving] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      loadSettings()
    }
  }, [isOpen, userId])

  const loadSettings = async () => {
    try {
      // Carregar configurações do usuário
      const { data: userSettings } = await supabase
        .from('user_dashboard_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (userSettings) {
        if (userSettings.active_widgets) {
          const savedWidgets = userSettings.active_widgets as Widget[]
          // Mesclar com widgets padrão para garantir que novos widgets apareçam
          const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
            const savedWidget = savedWidgets.find(w => w.id === defaultWidget.id)
            return savedWidget || defaultWidget
          })
          setWidgets(mergedWidgets.sort((a, b) => a.order - b.order))
        }
      }

      // Carregar branding da empresa
      const { data: branding } = await supabase
        .from('company_branding')
        .select('*')
        .single()

      if (branding) {
        setCompanyLogo(branding.logo_url || '')
        setCompanyIcon(branding.icon_url || '')
        setPrimaryColor(branding.primary_color || '#4370d1')
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Salvar configurações do usuário
      const { error: userError } = await supabase
        .from('user_dashboard_settings')
        .upsert({
          user_id: userId,
          active_widgets: widgets,
          layout: widgets.filter(w => w.visible).map(w => ({ i: w.id, w: w.size === 'large' ? 6 : w.size === 'medium' ? 3 : 2, h: 2 })),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (userError) throw userError

      // Salvar branding (apenas se for admin - verificar no backend)
      if (companyLogo || companyIcon || primaryColor) {
        await supabase
          .from('company_branding')
          .update({
            logo_url: companyLogo,
            icon_url: companyIcon,
            primary_color: primaryColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', (await supabase.from('company_branding').select('id').single()).data?.id)
      }

      onSave({
        layout: widgets,
        theme: 'light',
        companyLogo,
        companyIcon,
        primaryColor
      })

      onClose()
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ))
  }

  const changeWidgetSize = (widgetId: string, size: Widget['size']) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, size } : w
    ))
  }

  const resetToDefault = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      setWidgets(DEFAULT_WIDGETS)
      setPrimaryColor('#4370d1')
    }
  }

  const handleReorder = (newOrder: Widget[]) => {
    setWidgets(newOrder.map((w, index) => ({ ...w, order: index })))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon') => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`

      // Upload para o bucket branding
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        // Tentar no bucket avatars como fallback
        const { error: fallbackError } = await supabase.storage
          .from('avatars')
          .upload(`branding-${fileName}`, file, {
            cacheControl: '3600',
            upsert: true
          })
        
        if (fallbackError) throw fallbackError
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(`branding-${fileName}`)
        
        if (type === 'logo') {
          setCompanyLogo(publicUrl)
        } else {
          setCompanyIcon(publicUrl)
        }
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName)

      if (type === 'logo') {
        setCompanyLogo(publicUrl)
      } else {
        setCompanyIcon(publicUrl)
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload da imagem. Verifique as permissões do storage.')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-100)' }}
              >
                <Settings className="w-5 h-5" style={{ color: 'var(--primary-600)' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Personalizar Dashboard
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Arraste e organize seus widgets
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--border-light)' }}>
            {[
              { id: 'widgets', label: 'Widgets', icon: Grid3X3 },
              { id: 'appearance', label: 'Aparência', icon: Palette },
              { id: 'branding', label: 'Marca', icon: Image }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium text-sm transition-all border-b-2 ${
                  activeTab === tab.id ? 'border-primary-500' : 'border-transparent'
                }`}
                style={{
                  color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-tertiary)',
                  borderColor: activeTab === tab.id ? 'var(--primary-500)' : 'transparent'
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {/* Widgets Tab */}
            {activeTab === 'widgets' && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Arraste os widgets para reordenar. Clique no olho para mostrar/ocultar.
                </p>

                <Reorder.Group 
                  axis="y" 
                  values={widgets} 
                  onReorder={handleReorder}
                  className="space-y-2"
                >
                  {widgets.map(widget => {
                    const IconComponent = widget.icon
                    return (
                      <Reorder.Item
                        key={widget.id}
                        value={widget}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-move transition-all ${
                          widget.visible ? '' : 'opacity-50'
                        }`}
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: draggedWidget === widget.id ? 'var(--primary-500)' : 'var(--border-light)'
                        }}
                        onDragStart={() => setDraggedWidget(widget.id)}
                        onDragEnd={() => setDraggedWidget(null)}
                      >
                        <GripVertical className="w-5 h-5" style={{ color: 'var(--text-disabled)' }} />
                        
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${widget.color}20` }}
                        >
                          <IconComponent className="w-5 h-5" style={{ color: widget.color }} />
                        </div>

                        <div className="flex-1">
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {widget.title}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Tamanho: {widget.size === 'large' ? 'Grande' : widget.size === 'medium' ? 'Médio' : 'Pequeno'}
                          </p>
                        </div>

                        {/* Size selector */}
                        <div className="flex gap-1">
                          {(['small', 'medium', 'large'] as const).map(size => (
                            <button
                              key={size}
                              onClick={() => changeWidgetSize(widget.id, size)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                widget.size === size ? 'ring-2' : ''
                              }`}
                              style={{
                                backgroundColor: widget.size === size ? 'var(--primary-100)' : 'var(--bg-tertiary)',
                                color: widget.size === size ? 'var(--primary-700)' : 'var(--text-tertiary)',
                                // @ts-ignore
                                '--tw-ring-color': 'var(--primary-500)'
                              }}
                            >
                              {size === 'small' ? 'P' : size === 'medium' ? 'M' : 'G'}
                            </button>
                          ))}
                        </div>

                        {/* Visibility toggle */}
                        <button
                          onClick={() => toggleWidgetVisibility(widget.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {widget.visible ? (
                            <Eye className="w-5 h-5" style={{ color: 'var(--success-500)' }} />
                          ) : (
                            <EyeOff className="w-5 h-5" style={{ color: 'var(--text-disabled)' }} />
                          )}
                        </button>
                      </Reorder.Item>
                    )
                  })}
                </Reorder.Group>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Cor Principal
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Cores Sugeridas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['#4370d1', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#14B8A6'].map(color => (
                      <button
                        key={color}
                        onClick={() => setPrimaryColor(color)}
                        className={`w-10 h-10 rounded-lg transition-transform hover:scale-110 ${
                          primaryColor === color ? 'ring-2 ring-offset-2' : ''
                        }`}
                        style={{ 
                          backgroundColor: color,
                          // @ts-ignore
                          '--tw-ring-color': color
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div 
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Preview
                  </p>
                  <div className="flex gap-3">
                    <div 
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Botão Primário
                    </div>
                    <div 
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{ 
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor
                      }}
                    >
                      Botão Secundário
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Logo da Empresa
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-xl p-6 text-center"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    {companyLogo ? (
                      <div className="relative inline-block">
                        <img 
                          src={companyLogo} 
                          alt="Logo" 
                          className="max-h-20 mx-auto rounded-lg"
                        />
                        <button
                          onClick={() => setCompanyLogo('')}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Clique para fazer upload do logo
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          PNG, JPG ou SVG (máx. 2MB)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleLogoUpload(e, 'logo')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Icon Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Ícone/Favicon
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-xl p-6 text-center"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    {companyIcon ? (
                      <div className="relative inline-block">
                        <img 
                          src={companyIcon} 
                          alt="Ícone" 
                          className="w-16 h-16 mx-auto rounded-lg object-cover"
                        />
                        <button
                          onClick={() => setCompanyIcon('')}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Image className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Clique para fazer upload do ícone
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          Recomendado: 512x512px
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleLogoUpload(e, 'icon')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div 
                  className="p-4 rounded-xl flex items-center gap-3"
                  style={{ 
                    backgroundColor: 'var(--warning-50)',
                    borderLeft: '4px solid var(--warning-500)'
                  }}
                >
                  <Settings className="w-5 h-5" style={{ color: 'var(--warning-600)' }} />
                  <p className="text-sm" style={{ color: 'var(--warning-700)' }}>
                    As alterações de marca afetam todos os usuários do sistema.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="flex items-center justify-between p-6 border-t"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:bg-gray-100"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrão
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

