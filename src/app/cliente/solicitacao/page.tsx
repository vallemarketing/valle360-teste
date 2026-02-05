'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Upload, Calendar, AlertCircle, Tag, MessageSquare,
  CheckCircle2, X, Paperclip, Trash2, Send, Clock, Star
} from 'lucide-react'
import { toast } from 'sonner'

interface FormData {
  title: string
  description: string
  serviceType: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  dueDate: string
  observations: string
  attachments: File[]
}

const SERVICE_TYPES = [
  { id: 'design', label: 'Design Gráfico', description: 'Banners, posts, materiais visuais' },
  { id: 'web', label: 'Web Design', description: 'Landing pages, sites, layouts' },
  { id: 'video', label: 'Vídeo/Motion', description: 'Edição de vídeo, animações' },
  { id: 'social', label: 'Social Media', description: 'Conteúdo para redes sociais' },
  { id: 'marketing', label: 'Marketing', description: 'Campanhas, estratégias' },
  { id: 'outro', label: 'Outro', description: 'Outros serviços' }
]

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-700', icon: '⬇️' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700', icon: '➡️' },
  high: { label: 'Alta', color: 'bg-amber-100 text-amber-700', icon: '⬆️' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700', icon: '🔥' }
}

export default function ClientRequestPage() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    serviceType: '',
    priority: 'normal',
    dueDate: '',
    observations: '',
    attachments: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error(`${file.name} é muito grande. Máximo: 10MB`)
        return false
      }
      return true
    })

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Digite um título para a solicitação')
      return
    }
    if (!formData.serviceType) {
      toast.error('Selecione o tipo de serviço')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Descreva o que você precisa')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/kanban/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          serviceType: formData.serviceType,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
          observations: formData.observations || '',
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.success) {
        const msg = data?.error || 'Erro ao enviar solicitação'
        throw new Error(msg)
      }

      setIsSuccess(true)
      toast.success('Solicitação enviada com sucesso!')

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao enviar solicitação'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8 rounded-2xl shadow-lg max-w-md"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--success-100)' }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--success-600)' }} />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Solicitação Enviada! 🎉
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Sua solicitação foi recebida e já entrou no nosso fluxo de produção.
            Você pode acompanhar o andamento pelas etapas.
          </p>

          <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {formData.title}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {SERVICE_TYPES.find(s => s.id === formData.serviceType)?.label} • {PRIORITY_CONFIG[formData.priority].label}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="/cliente/producao"
              className="px-6 py-3 rounded-xl font-medium text-white"
              style={{ backgroundColor: '#4370d1' }}
            >
              Acompanhar andamento
            </a>
            <button
              onClick={() => {
                setIsSuccess(false)
                setFormData({
                  title: '',
                  description: '',
                  serviceType: '',
                  priority: 'normal',
                  dueDate: '',
                  observations: '',
                  attachments: []
                })
              }}
              className="px-6 py-3 rounded-xl font-medium"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
            >
              Nova Solicitação
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Nova Solicitação
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Preencha o formulário abaixo para solicitar um novo serviço
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl shadow-sm"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
          >
            <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-4 h-4" style={{ color: '#4370d1' }} />
              Título da Solicitação *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Banner para campanha de Black Friday"
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </motion.div>

          {/* Tipo de Serviço */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl shadow-sm"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
          >
            <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              <Tag className="w-4 h-4" style={{ color: '#4370d1' }} />
              Tipo de Serviço *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SERVICE_TYPES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setFormData({ ...formData, serviceType: service.id })}
                  className={`p-4 rounded-xl text-left transition-all ${
                    formData.serviceType === service.id
                      ? 'ring-2 ring-blue-500 shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                  style={{ 
                    backgroundColor: formData.serviceType === service.id 
                      ? 'var(--primary-50)' 
                      : 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {service.label}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {service.description}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Descrição */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl shadow-sm"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
          >
            <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              <MessageSquare className="w-4 h-4" style={{ color: '#4370d1' }} />
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva detalhadamente o que você precisa..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </motion.div>

          {/* Prioridade e Prazo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Prioridade */}
            <div 
              className="p-6 rounded-xl shadow-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
            >
              <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                <AlertCircle className="w-4 h-4" style={{ color: '#4370d1' }} />
                Prioridade
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PRIORITY_CONFIG) as Array<keyof typeof PRIORITY_CONFIG>).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setFormData({ ...formData, priority })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.priority === priority
                        ? PRIORITY_CONFIG[priority].color + ' ring-2 ring-offset-2'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {PRIORITY_CONFIG[priority].icon} {PRIORITY_CONFIG[priority].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prazo */}
            <div 
              className="p-6 rounded-xl shadow-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
            >
              <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                <Calendar className="w-4 h-4" style={{ color: '#4370d1' }} />
                Prazo Desejado
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </motion.div>

          {/* Anexos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-xl shadow-sm"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
          >
            <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              <Paperclip className="w-4 h-4" style={{ color: '#4370d1' }} />
              Anexos
            </label>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: dragActive ? '#4370d1' : 'var(--text-tertiary)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Imagens, PDFs, documentos (máx. 10MB cada)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />

            {/* File List */}
            {formData.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {file.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Observações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-xl shadow-sm"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
          >
            <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              <Star className="w-4 h-4" style={{ color: '#4370d1' }} />
              Observações Adicionais
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Informações extras, referências, links..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#4370d1' }}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Solicitação
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}








