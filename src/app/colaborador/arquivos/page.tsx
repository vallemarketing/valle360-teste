'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, File, Folder, Search, Grid, List, Download, Trash2, Eye, Plus, Send, Users, X, Check, Image, FileText, Film } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface FileItem {
  id: string
  name: string
  type: string
  size: string
  date: string
  folder: string
  url: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  thumbnailUrl?: string
}

export default function ArquivosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedClientForApproval, setSelectedClientForApproval] = useState('')
  const [approvalMessage, setApprovalMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const res = await fetch('/api/collaborator/clients', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao carregar clientes')
      const rows = Array.isArray(json?.clients) ? json.clients : []
      setClients(
        rows.map((c: any) => ({
          id: String(c?.id || ''),
          company_name: String(c?.company || c?.companyName || 'Cliente'),
        }))
      )
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadFiles = async () => {
    try {
      // Mock data - integrar com banco depois
      setFiles([
        { id: '1', name: 'Projeto_Cliente_A.pdf', type: 'pdf', size: '2.5 MB', date: '2025-01-10', folder: 'Projetos', url: '#', status: 'draft' },
        { id: '2', name: 'Design_Final.fig', type: 'figma', size: '15.3 MB', date: '2025-01-08', folder: 'Design', url: '#', status: 'approved' },
        { id: '3', name: 'Apresentacao.pptx', type: 'powerpoint', size: '8.1 MB', date: '2025-01-05', folder: 'Apresentações', url: '#', status: 'pending_approval' },
        { id: '4', name: 'Banner_Instagram.png', type: 'image', size: '1.2 MB', date: '2025-01-12', folder: 'Social Media', url: '#', status: 'draft', thumbnailUrl: 'https://picsum.photos/seed/banner1/200/200' },
        { id: '5', name: 'Video_Reels.mp4', type: 'video', size: '45.8 MB', date: '2025-01-11', folder: 'Videos', url: '#', status: 'draft' }
      ])
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    
    if (droppedFiles.length > 0) {
      await uploadFiles(droppedFiles)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      await uploadFiles(Array.from(selectedFiles))
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFiles = async (filesToUpload: File[]) => {
    setUploading(true)
    toast.info(`Fazendo upload de ${filesToUpload.length} arquivo(s)...`)

    try {
      for (const file of filesToUpload) {
        // Simular upload - em produção, usar Supabase Storage
        await new Promise(resolve => setTimeout(resolve, 500))

        const newFile: FileItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: getFileType(file.name),
          size: formatFileSize(file.size),
          date: new Date().toISOString().split('T')[0],
          folder: 'Uploads',
          url: URL.createObjectURL(file),
          status: 'draft',
          thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }

        setFiles(prev => [newFile, ...prev])
      }

      toast.success(`${filesToUpload.length} arquivo(s) enviado(s) com sucesso!`)
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload dos arquivos')
    } finally {
      setUploading(false)
    }
  }

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const typeMap: Record<string, string> = {
      'pdf': 'pdf',
      'doc': 'word',
      'docx': 'word',
      'xls': 'excel',
      'xlsx': 'excel',
      'ppt': 'powerpoint',
      'pptx': 'powerpoint',
      'fig': 'figma',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'webp': 'image',
      'mp4': 'video',
      'mov': 'video',
      'avi': 'video'
    }
    return typeMap[ext || ''] || 'file'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-8 h-8" />
      case 'video':
        return <Film className="w-8 h-8" />
      case 'pdf':
      case 'word':
      case 'excel':
      case 'powerpoint':
        return <FileText className="w-8 h-8" />
      default:
        return <File className="w-8 h-8" />
    }
  }

  const handleSendForApproval = (file: FileItem) => {
    setSelectedFile(file)
    setIsApprovalModalOpen(true)
  }

  const submitApproval = async () => {
    if (!selectedClientForApproval) {
      toast.error('Selecione um cliente')
      return
    }

    try {
      // Atualizar status do arquivo
      setFiles(files.map(f => 
        f.id === selectedFile?.id 
          ? { ...f, status: 'pending_approval' as const }
          : f
      ))

      // Em produção, salvar no banco e enviar notificação
      // await supabase.from('approval_requests').insert({
      //   file_id: selectedFile?.id,
      //   client_id: selectedClientForApproval,
      //   message: approvalMessage,
      //   status: 'pending'
      // })

      // Enviar notificação para o cliente
      // await fetch('/api/notifications/send', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     userId: selectedClientForApproval,
      //     type: 'approval_request',
      //     title: 'Novo conteúdo para aprovar',
      //     message: `${selectedFile?.name} está aguardando sua aprovação`
      //   })
      // })

      const clientName = clients.find(c => c.id === selectedClientForApproval)?.company_name || 'Cliente'
      toast.success(`Arquivo enviado para aprovação de ${clientName}`)
      
      setIsApprovalModalOpen(false)
      setSelectedClientForApproval('')
      setApprovalMessage('')
      setSelectedFile(null)
    } catch (error) {
      console.error('Erro ao enviar para aprovação:', error)
      toast.error('Erro ao enviar para aprovação')
    }
  }

  const handleDeleteFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId))
    toast.success('Arquivo removido')
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: FileItem['status']) => {
    switch (status) {
      case 'pending_approval':
        return <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Em Aprovação</span>
      case 'approved':
        return <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Aprovado</span>
      case 'rejected':
        return <span className="bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Rejeitado</span>
      default:
        return null
    }
  }

  return (
    <div 
      className="min-h-screen p-8" 
      style={{ backgroundColor: 'var(--bg-primary)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.fig"
      />

      {/* Overlay de Drag & Drop */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(67, 112, 209, 0.2)' }}
          >
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
              <Upload className="w-16 h-16 mb-4" style={{ color: '#4370d1' }} />
              <h3 className="text-2xl font-bold" style={{ color: '#4370d1' }}>Solte os arquivos aqui</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Para fazer upload instantâneo</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval Modal */}
      <AnimatePresence>
        {isApprovalModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setIsApprovalModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              style={{ backgroundColor: 'var(--bg-primary)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Enviar para Aprovação
                  </h3>
                  <button 
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  O cliente receberá uma notificação para revisar este arquivo.
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* File Preview */}
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--primary-100)', color: '#4370d1' }}>
                    {getFileIcon(selectedFile?.type || 'file')}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedFile?.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{selectedFile?.size}</p>
                  </div>
                </div>

                {/* Client Select */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Selecione o Cliente *
                  </label>
                  <select 
                    className="w-full p-3 rounded-lg border focus:ring-2 outline-none"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                    value={selectedClientForApproval}
                    onChange={(e) => setSelectedClientForApproval(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.company_name}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Mensagem (opcional)
                  </label>
                  <textarea
                    value={approvalMessage}
                    onChange={(e) => setApprovalMessage(e.target.value)}
                    placeholder="Adicione uma mensagem para o cliente..."
                    rows={3}
                    className="w-full p-3 rounded-lg border focus:ring-2 outline-none resize-none"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
              
              <div 
                className="p-6 flex justify-end gap-3"
                style={{ borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <button 
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 font-medium rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={submitApproval}
                  className="px-4 py-2 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  style={{ backgroundColor: '#4370d1' }}
                >
                  <Send className="w-4 h-4" />
                  Enviar Agora
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Meus Arquivos
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gerencie seus documentos e envie para aprovação
            </p>
          </div>
          <button 
            className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-primary)', 
              borderColor: 'var(--border-light)',
              color: 'var(--text-secondary)'
            }}
          >
            <Plus className="w-4 h-4" />
            Nova Pasta
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl border transition-colors`}
              style={{
                backgroundColor: viewMode === 'grid' ? 'var(--primary-50)' : 'var(--bg-primary)',
                borderColor: viewMode === 'grid' ? '#4370d1' : 'var(--border-light)'
              }}
            >
              <Grid className="w-5 h-5" style={{ color: viewMode === 'grid' ? '#4370d1' : 'var(--text-tertiary)' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl border transition-colors`}
              style={{
                backgroundColor: viewMode === 'list' ? 'var(--primary-50)' : 'var(--bg-primary)',
                borderColor: viewMode === 'list' ? '#4370d1' : 'var(--border-light)'
              }}
            >
              <List className="w-5 h-5" style={{ color: viewMode === 'list' ? '#4370d1' : 'var(--text-tertiary)' }} />
            </button>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors text-white shadow-lg disabled:opacity-50"
            style={{ backgroundColor: '#4370d1' }}
          >
            <Upload className={`w-5 h-5 ${uploading ? 'animate-bounce' : ''}`} />
            {uploading ? 'Enviando...' : 'Upload Arquivo'}
          </button>
        </div>

        {/* Files Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#4370d1' }} />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div 
            className="text-center py-16 border-2 border-dashed rounded-3xl"
            style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <File className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
              {searchTerm ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo ainda'}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {searchTerm ? 'Tente buscar por outro termo' : 'Faça upload de seus primeiros arquivos ou arraste-os para cá'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: '#4370d1' }}
              >
                Fazer Upload
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border cursor-pointer hover:shadow-xl transition-all group relative"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
              >
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(file.status)}
                </div>

                {/* Hover Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {file.status === 'draft' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSendForApproval(file); }}
                      className="p-1.5 rounded-lg shadow transition-colors"
                      style={{ backgroundColor: 'var(--bg-primary)' }}
                      title="Enviar para Aprovação"
                    >
                      <Users size={14} style={{ color: '#4370d1' }} />
                    </button>
                  )}
                  <button 
                    className="p-1.5 rounded-lg shadow transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    <Download size={14} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                    className="p-1.5 rounded-lg shadow transition-colors hover:bg-red-50"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center pt-6">
                  {file.thumbnailUrl ? (
                    <div 
                      className="w-16 h-16 rounded-2xl mb-4 bg-cover bg-center"
                      style={{ backgroundImage: `url(${file.thumbnailUrl})` }}
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: 'var(--primary-50)', color: '#4370d1' }}
                    >
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <h3 className="font-semibold mb-1 truncate w-full px-2" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </h3>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    {file.size} • {file.date}
                  </p>
                  <span 
                    className="px-2 py-1 text-[10px] rounded-full uppercase tracking-wider font-bold"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                  >
                    {file.type}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div 
            className="space-y-2 rounded-2xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                style={{ borderBottom: '1px solid var(--border-light)' }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--primary-50)', color: '#4370d1' }}
                  >
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{file.folder}</span>
                      <span>•</span>
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{file.date}</span>
                      {file.status !== 'draft' && (
                        <span className="ml-2">{getStatusBadge(file.status)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                  {file.status === 'draft' && (
                    <button 
                      onClick={() => handleSendForApproval(file)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#4370d1' }}
                      title="Enviar para Aprovação"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-2 rounded-lg transition-colors hover:text-red-500"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
