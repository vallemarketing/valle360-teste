'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Calendar, Tag, User, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getColumnsByArea } from '@/lib/kanban/columnsByArea'
import { getFieldsByAreaAndColumn } from '@/lib/kanban/fieldsByColumn'

interface NewTaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: any) => void
  userArea: string
}

export function NewTaskForm({ isOpen, onClose, onSave, userArea }: NewTaskFormProps) {
  const availableColumns = getColumnsByArea(userArea)
  const defaultColumn = availableColumns?.[0]?.id || 'todo'
  const [selectedColumn, setSelectedColumn] = useState(defaultColumn)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignees: [],
    tags: [],
    column: 'todo',
    // Campos obrigatórios
    client: '',
    area: userArea || '',
    referenceLinks: '',
    driveLink: '',
    attachments: '',
    estimatedHours: '',
    dependencies: '',
    // Campos dinâmicos da coluna/área
    dynamicFields: {} as Record<string, any>
  })

  const columnFields = getFieldsByAreaAndColumn(userArea, selectedColumn)

  // Se a área mudar, garantir que a coluna selecionada exista para evitar "value fora da lista"
  useEffect(() => {
    const cols = getColumnsByArea(userArea)
    const first = cols?.[0]?.id || 'todo'
    setSelectedColumn(first)
    setFormData((prev) => ({
      ...prev,
      column: first,
      area: userArea || prev.area
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userArea])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      column: selectedColumn,
      ...formData.dynamicFields
    })
    onClose()
    resetForm()
  }

  const resetForm = () => {
    setSelectedColumn('todo')
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignees: [],
      tags: [],
      column: 'todo',
      client: '',
      area: userArea || '',
      referenceLinks: '',
      driveLink: '',
      attachments: '',
      estimatedHours: '',
      dependencies: '',
      dynamicFields: {}
    })
  }

  const handleDynamicFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dynamicFields: {
        ...prev.dynamicFields,
        [fieldName]: value
      }
    }))
  }

  const renderDynamicField = (field: any) => {
    const value = formData.dynamicFields[field.name] || ''

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
              required={field.required}
            >
              <option value="">Selecione...</option>
              {field.options?.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 min-h-[100px]"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
              required={field.required}
            />
          </div>
        )

      case 'number':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
              required={field.required}
            />
          </div>
        )

      case 'date':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
              required={field.required}
            />
          </div>
        )

      default: // text, url, file
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
              required={field.required}
            />
          </div>
        )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Nova Tarefa - {userArea}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda - Campos Básicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                Informações Básicas
              </h3>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Digite o título da tarefa"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a tarefa..."
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 min-h-[100px]"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Coluna de Destino */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Coluna <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                  required
                >
                  {availableColumns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Cliente
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  placeholder="Nome do cliente"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* Prazo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Prazo
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Horas Estimadas */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Horas Estimadas
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="Ex: 8"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Links de Referência */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Links de Referência
                </label>
                <textarea
                  value={formData.referenceLinks}
                  onChange={(e) => setFormData({ ...formData, referenceLinks: e.target.value })}
                  placeholder="Um link por linha"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 min-h-[80px]"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Google Drive */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Link do Google Drive
                </label>
                <input
                  type="url"
                  value={formData.driveLink}
                  onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Coluna Direita - Campos Específicos da Coluna */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                Campos Específicos - {availableColumns.find(c => c.id === selectedColumn)?.title}
              </h3>

              {columnFields.length > 0 ? (
                columnFields.map(field => renderDynamicField(field))
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Nenhum campo adicional para esta etapa
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div 
            className="flex items-center justify-end gap-3 pt-6 mt-6 border-t"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-medium text-white transition-all flex items-center gap-2"
              style={{ backgroundColor: 'var(--primary-600)' }}
            >
              <Save className="w-4 h-4" />
              Criar Tarefa
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
