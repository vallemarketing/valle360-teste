'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Video,
  File,
  X,
  Check,
  Loader2,
  Search,
  Grid,
  List,
  ChevronRight,
  HardDrive,
  Palette,
  ExternalLink,
  RefreshCw,
  Plus,
} from 'lucide-react';
import type { DriveFile } from '@/lib/integrations/googleDrive';
import type { CanvaDesign } from '@/lib/integrations/canva';

// ===== TYPES =====

interface LocalAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnailUrl?: string;
  size?: number;
  mimeType: string;
}

interface AssetPickerProps {
  clientId: string;
  onSelect: (assets: SelectedAsset[]) => void;
  onClose: () => void;
  maxSelection?: number;
  acceptedTypes?: string[];
  initialAssets?: SelectedAsset[];
}

export interface SelectedAsset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  source: 'local' | 'drive' | 'canva';
  mimeType?: string;
  canvaDesignId?: string;
}

type AssetSource = 'local' | 'drive' | 'canva';
type ViewMode = 'grid' | 'list';

// ===== HELPER FUNCTIONS =====

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Video;
  return File;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// ===== MAIN COMPONENT =====

export function AssetPicker({
  clientId,
  onSelect,
  onClose,
  maxSelection = 10,
  acceptedTypes = ['image/*', 'video/*'],
  initialAssets = [],
}: AssetPickerProps) {
  const [activeSource, setActiveSource] = useState<AssetSource>('local');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>(initialAssets);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Source states
  const [driveConnected, setDriveConnected] = useState(false);
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolders, setDriveFolders] = useState<DriveFile[]>([]);
  const [currentDriveFolder, setCurrentDriveFolder] = useState<string | null>(null);
  const [drivePath, setDrivePath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Meu Drive' }]);
  const [canvaDesigns, setCanvaDesigns] = useState<CanvaDesign[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalAsset[]>([]);

  // Check connections on mount
  useEffect(() => {
    checkConnections();
  }, [clientId]);

  const checkConnections = async () => {
    try {
      const res = await fetch(`/api/client/${clientId}/integrations/status`);
      if (res.ok) {
        const data = await res.json();
        setDriveConnected(data.googleDrive?.connected || false);
        setCanvaConnected(data.canva?.connected || false);
      }
    } catch (error) {
      console.error('Failed to check connections:', error);
    }
  };

  // Load data when source changes
  useEffect(() => {
    if (activeSource === 'drive' && driveConnected) {
      loadDriveFiles(currentDriveFolder);
    } else if (activeSource === 'canva' && canvaConnected) {
      loadCanvaDesigns();
    }
  }, [activeSource, driveConnected, canvaConnected, currentDriveFolder]);

  const loadDriveFiles = async (folderId: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (folderId) params.set('folderId', folderId);
      params.set('mimeTypeFilter', 'image');
      
      const res = await fetch(`/api/client/${clientId}/drive/files?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
        setDriveFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to load Drive files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCanvaDesigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/client/${clientId}/canva/designs`);
      if (res.ok) {
        const data = await res.json();
        setCanvaDesigns(data.designs || []);
      }
    } catch (error) {
      console.error('Failed to load Canva designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDriveFolder = (folderId: string | null, folderName: string, isBack = false) => {
    if (isBack) {
      const idx = drivePath.findIndex(p => p.id === folderId);
      setDrivePath(drivePath.slice(0, idx + 1));
    } else {
      setDrivePath([...drivePath, { id: folderId, name: folderName }]);
    }
    setCurrentDriveFolder(folderId);
  };

  const handleLocalUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setLoading(true);
    const uploaded: LocalAsset[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Upload to Supabase storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      
      try {
        const res = await fetch('/api/upload/asset', {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          uploaded.push({
            id: data.id,
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            size: file.size,
            mimeType: file.type,
          });
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
    
    setLocalFiles(prev => [...prev, ...uploaded]);
    setLoading(false);
  }, [clientId]);

  const toggleAsset = (asset: SelectedAsset) => {
    const isSelected = selectedAssets.some(a => a.id === asset.id);
    
    if (isSelected) {
      setSelectedAssets(prev => prev.filter(a => a.id !== asset.id));
    } else if (selectedAssets.length < maxSelection) {
      setSelectedAssets(prev => [...prev, asset]);
    }
  };

  const isAssetSelected = (id: string) => selectedAssets.some(a => a.id === id);

  const handleConfirm = () => {
    onSelect(selectedAssets);
    onClose();
  };

  const connectDrive = () => {
    window.open(`/api/oauth/google/authorize?clientId=${clientId}&redirect=/social/assets`, '_blank');
  };

  const connectCanva = () => {
    window.open(`/api/oauth/canva/authorize?clientId=${clientId}&redirect=/social/assets`, '_blank');
  };

  const createCanvaDesign = async (type: string) => {
    try {
      const res = await fetch(`/api/client/${clientId}/canva/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designType: type, title: 'Novo Design' }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.editUrl) {
          window.open(data.editUrl, '_blank');
        }
        // Reload designs after creation
        setTimeout(() => loadCanvaDesigns(), 2000);
      }
    } catch (error) {
      console.error('Failed to create Canva design:', error);
    }
  };

  // Filter assets by search
  const filteredDriveFiles = driveFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCanvaDesigns = canvaDesigns.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredLocalFiles = localFiles.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Selecionar Mídia
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {selectedAssets.length} de {maxSelection} selecionados
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div
              className="flex rounded-lg p-1"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <button
                onClick={() => setViewMode('grid')}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: viewMode === 'grid' ? 'var(--bg-primary)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--primary-600)' : 'var(--text-tertiary)',
                }}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary-600)' : 'var(--text-tertiary)',
                }}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* Source tabs */}
        <div
          className="flex items-center gap-1 px-6 py-3 border-b"
          style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <button
            onClick={() => setActiveSource('local')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{
              backgroundColor: activeSource === 'local' ? 'var(--bg-primary)' : 'transparent',
              color: activeSource === 'local' ? 'var(--primary-600)' : 'var(--text-secondary)',
              boxShadow: activeSource === 'local' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          
          <button
            onClick={() => setActiveSource('drive')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{
              backgroundColor: activeSource === 'drive' ? 'var(--bg-primary)' : 'transparent',
              color: activeSource === 'drive' ? 'var(--primary-600)' : 'var(--text-secondary)',
              boxShadow: activeSource === 'drive' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <HardDrive className="w-4 h-4" />
            Google Drive
            {!driveConnected && (
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
            )}
          </button>
          
          <button
            onClick={() => setActiveSource('canva')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{
              backgroundColor: activeSource === 'canva' ? 'var(--bg-primary)' : 'transparent',
              color: activeSource === 'canva' ? 'var(--primary-600)' : 'var(--text-secondary)',
              boxShadow: activeSource === 'canva' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Palette className="w-4 h-4" />
            Canva
            {!canvaConnected && (
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 py-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-500)' }} />
            </div>
          ) : (
            <>
              {/* LOCAL UPLOAD */}
              {activeSource === 'local' && (
                <div className="space-y-6">
                  {/* Drop zone */}
                  <label
                    className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-solid"
                    style={{
                      borderColor: 'var(--primary-300)',
                      backgroundColor: 'var(--primary-50)',
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept={acceptedTypes.join(',')}
                      onChange={(e) => handleLocalUpload(e.target.files)}
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 mb-3" style={{ color: 'var(--primary-500)' }} />
                    <p className="font-medium" style={{ color: 'var(--primary-700)' }}>
                      Arraste arquivos ou clique para selecionar
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--primary-600)' }}>
                      Imagens e vídeos até 100MB
                    </p>
                  </label>

                  {/* Uploaded files */}
                  {filteredLocalFiles.length > 0 && (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
                      {filteredLocalFiles.map((file) => (
                        <AssetCard
                          key={file.id}
                          id={file.id}
                          name={file.name}
                          thumbnailUrl={file.thumbnailUrl || file.url}
                          mimeType={file.mimeType}
                          size={formatFileSize(file.size)}
                          viewMode={viewMode}
                          isSelected={isAssetSelected(file.id)}
                          onClick={() => toggleAsset({
                            id: file.id,
                            name: file.name,
                            url: file.url,
                            thumbnailUrl: file.thumbnailUrl,
                            source: 'local',
                            mimeType: file.mimeType,
                          })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* GOOGLE DRIVE */}
              {activeSource === 'drive' && (
                <>
                  {!driveConnected ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <HardDrive className="w-16 h-16 mb-4" style={{ color: 'var(--text-tertiary)' }} />
                      <p className="font-medium text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                        Conectar Google Drive
                      </p>
                      <p className="text-sm mb-6 text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
                        Conecte sua conta do Google Drive para acessar seus arquivos diretamente.
                      </p>
                      <button
                        onClick={connectDrive}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white"
                        style={{ backgroundColor: '#4285F4' }}
                      >
                        <HardDrive className="w-5 h-5" />
                        Conectar Google Drive
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Breadcrumb navigation */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {drivePath.map((folder, idx) => (
                          <React.Fragment key={folder.id || 'root'}>
                            {idx > 0 && <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />}
                            <button
                              onClick={() => navigateDriveFolder(folder.id, folder.name, true)}
                              className="px-2 py-1 rounded text-sm hover:bg-black/5"
                              style={{ color: idx === drivePath.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                            >
                              {folder.name}
                            </button>
                          </React.Fragment>
                        ))}
                        <button
                          onClick={() => loadDriveFiles(currentDriveFolder)}
                          className="ml-auto p-2 rounded-lg hover:bg-black/5"
                        >
                          <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        </button>
                      </div>

                      {/* Folders */}
                      {driveFolders.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                            Pastas
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {driveFolders.map((folder) => (
                              <button
                                key={folder.id}
                                onClick={() => navigateDriveFolder(folder.id, folder.name)}
                                className="flex items-center gap-2 p-3 rounded-lg border text-left hover:border-blue-300 transition-colors"
                                style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
                              >
                                <FolderOpen className="w-5 h-5" style={{ color: '#4285F4' }} />
                                <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                  {folder.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      {filteredDriveFiles.length > 0 ? (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
                          {filteredDriveFiles.map((file) => (
                            <AssetCard
                              key={file.id}
                              id={file.id}
                              name={file.name}
                              thumbnailUrl={file.thumbnailLink}
                              mimeType={file.mimeType}
                              size={formatFileSize(file.size ? parseInt(file.size) : undefined)}
                              viewMode={viewMode}
                              isSelected={isAssetSelected(file.id)}
                              onClick={() => toggleAsset({
                                id: file.id,
                                name: file.name,
                                url: file.webContentLink || file.webViewLink || '',
                                thumbnailUrl: file.thumbnailLink,
                                source: 'drive',
                                mimeType: file.mimeType,
                              })}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhum arquivo encontrado nesta pasta</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* CANVA */}
              {activeSource === 'canva' && (
                <>
                  {!canvaConnected ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Palette className="w-16 h-16 mb-4" style={{ color: 'var(--text-tertiary)' }} />
                      <p className="font-medium text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                        Conectar Canva
                      </p>
                      <p className="text-sm mb-6 text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
                        Conecte sua conta do Canva para acessar e editar seus designs diretamente.
                      </p>
                      <button
                        onClick={connectCanva}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white"
                        style={{ backgroundColor: '#00C4CC' }}
                      >
                        <Palette className="w-5 h-5" />
                        Conectar Canva
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Create new design */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => createCanvaDesign('instagramPost')}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                          style={{ backgroundColor: '#00C4CC' }}
                        >
                          <Plus className="w-4 h-4" />
                          Novo Post Instagram
                        </button>
                        <button
                          onClick={() => createCanvaDesign('facebookPost')}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
                          style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                        >
                          <Plus className="w-4 h-4" />
                          Novo Post Facebook
                        </button>
                        <button
                          onClick={loadCanvaDesigns}
                          className="ml-auto p-2 rounded-lg hover:bg-black/5"
                        >
                          <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        </button>
                      </div>

                      {/* Designs grid */}
                      {filteredCanvaDesigns.length > 0 ? (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
                          {filteredCanvaDesigns.map((design) => (
                            <div key={design.id} className="relative group">
                              <AssetCard
                                id={design.id}
                                name={design.title}
                                thumbnailUrl={design.thumbnailUrl}
                                mimeType="image/png"
                                viewMode={viewMode}
                                isSelected={isAssetSelected(design.id)}
                                onClick={() => toggleAsset({
                                  id: design.id,
                                  name: design.title,
                                  url: design.viewUrl || '',
                                  thumbnailUrl: design.thumbnailUrl,
                                  source: 'canva',
                                  canvaDesignId: design.id,
                                })}
                              />
                              {/* Edit button */}
                              {design.editUrl && (
                                <a
                                  href={design.editUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute top-2 right-2 p-2 rounded-lg bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-4 h-4" style={{ color: '#00C4CC' }} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                          <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhum design encontrado</p>
                          <p className="text-sm mt-1">Crie um novo design acima</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Selected assets bar */}
        <AnimatePresence>
          {selectedAssets.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="border-t px-6 py-4"
              style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-4">
                {/* Thumbnails */}
                <div className="flex -space-x-3">
                  {selectedAssets.slice(0, 5).map((asset) => (
                    <div
                      key={asset.id}
                      className="w-12 h-12 rounded-lg border-2 overflow-hidden"
                      style={{ borderColor: 'var(--bg-secondary)' }}
                    >
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                          <ImageIcon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedAssets.length > 5 && (
                    <div
                      className="w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium"
                      style={{
                        borderColor: 'var(--bg-secondary)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      +{selectedAssets.length - 5}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedAssets.length} arquivo(s) selecionado(s)
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Clique em Confirmar para adicionar ao post
                  </p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => setSelectedAssets([])}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Limpar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--primary-600)' }}
                >
                  <Check className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ===== ASSET CARD COMPONENT =====

interface AssetCardProps {
  id: string;
  name: string;
  thumbnailUrl?: string;
  mimeType: string;
  size?: string;
  viewMode: ViewMode;
  isSelected: boolean;
  onClick: () => void;
}

function AssetCard({
  id,
  name,
  thumbnailUrl,
  mimeType,
  size,
  viewMode,
  isSelected,
  onClick,
}: AssetCardProps) {
  const Icon = getFileIcon(mimeType);

  if (viewMode === 'list') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
        style={{
          borderColor: isSelected ? 'var(--primary-500)' : 'var(--border-light)',
          backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-primary)',
        }}
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <Icon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {name}
          </p>
          {size && (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {size}
            </p>
          )}
        </div>

        {/* Selection indicator */}
        <div
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
          style={{
            borderColor: isSelected ? 'var(--primary-500)' : 'var(--border-light)',
            backgroundColor: isSelected ? 'var(--primary-500)' : 'transparent',
          }}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </button>
    );
  }

  // Grid view
  return (
    <button
      onClick={onClick}
      className="relative rounded-xl overflow-hidden border transition-all group"
      style={{
        borderColor: isSelected ? 'var(--primary-500)' : 'var(--border-light)',
        borderWidth: isSelected ? '2px' : '1px',
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-square">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <Icon className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}
      </div>

      {/* Overlay on hover */}
      <div
        className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}
      >
        <div className="w-full p-3">
          <p className="text-white text-sm font-medium truncate">{name}</p>
          {size && <p className="text-white/70 text-xs">{size}</p>}
        </div>
      </div>

      {/* Selection indicator */}
      <div
        className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: isSelected ? 'var(--primary-500)' : 'white',
          backgroundColor: isSelected ? 'var(--primary-500)' : 'rgba(255,255,255,0.5)',
        }}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

export default AssetPicker;
