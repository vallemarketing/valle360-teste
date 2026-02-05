'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Check, User, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string
  userId: string
  employeeId?: string
  onPhotoUpdate: (newUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export function ProfilePhotoUpload({ 
  currentPhotoUrl, 
  userId, 
  employeeId,
  onPhotoUpdate,
  size = 'md'
}: ProfilePhotoUploadProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
      setShowModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload para o Supabase Storage (bucket avatars)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar no banco de dados
      if (employeeId) {
        const { error: updateError } = await supabase
          .from('employees')
          .update({ avatar: publicUrl })
          .eq('id', employeeId)

        if (updateError) throw updateError
      }

      onPhotoUpdate(publicUrl)
      setShowModal(false)
      setPreviewUrl(null)
      setSelectedFile(null)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload da foto. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) return

    try {
      if (employeeId) {
        const { error } = await supabase
          .from('employees')
          .update({ avatar: null })
          .eq('id', employeeId)

        if (error) throw error
      }

      onPhotoUpdate('')
    } catch (error) {
      console.error('Erro ao remover foto:', error)
      alert('Erro ao remover foto. Tente novamente.')
    }
  }

  return (
    <>
      {/* Avatar com botão de upload */}
      <div 
        className={`relative ${sizeClasses[size]} rounded-full cursor-pointer group`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Imagem ou placeholder */}
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt="Foto de perfil"
            className={`${sizeClasses[size]} rounded-full object-cover ring-4`}
            style={{ 
              // @ts-ignore
              '--tw-ring-color': 'var(--primary-100)' 
            }}
          />
        ) : (
          <div 
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center ring-4`}
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              // @ts-ignore
              '--tw-ring-color': 'var(--primary-100)'
            }}
          >
            <User className={iconSizes[size]} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}

        {/* Overlay de hover */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 ${sizeClasses[size]} rounded-full flex items-center justify-center bg-black/50`}
            >
              <Camera className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge de câmera */}
        <div 
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg"
          style={{ 
            backgroundColor: 'var(--primary-500)',
            borderColor: 'var(--bg-primary)'
          }}
        >
          <Camera className="w-4 h-4 text-white" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Modal de preview e confirmação */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !isUploading && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm p-6 rounded-2xl shadow-2xl"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <h3 className="text-lg font-bold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>
                Nova Foto de Perfil
              </h3>

              {/* Preview */}
              <div className="flex justify-center mb-6">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-40 h-40 rounded-full object-cover ring-4"
                    style={{ 
                      // @ts-ignore
                      '--tw-ring-color': 'var(--primary-200)' 
                    }}
                  />
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setPreviewUrl(null)
                    setSelectedFile(null)
                  }}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary-500)' }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>

              {/* Opção de remover foto atual */}
              {currentPhotoUrl && !isUploading && (
                <button
                  onClick={() => {
                    setShowModal(false)
                    handleRemovePhoto()
                  }}
                  className="w-full mt-3 py-2 text-sm font-medium transition-all"
                  style={{ color: 'var(--error-500)' }}
                >
                  Remover foto atual
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

