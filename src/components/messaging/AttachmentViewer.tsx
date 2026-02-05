'use client';

import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
}

interface AttachmentViewerProps {
  attachment: Attachment;
  showInline?: boolean;
}

export function AttachmentViewer({ attachment, showInline = true }: AttachmentViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(attachment.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  const renderImageViewer = () => (
    <div className="relative group">
      <img
        src={attachment.file_url}
        alt={attachment.file_name}
        className="max-w-full max-h-96 rounded-lg cursor-pointer object-contain"
        onClick={() => setIsModalOpen(true)}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
      {attachment.width && attachment.height && (
        <p className="text-xs text-gray-500 mt-1">
          {attachment.width} × {attachment.height}
        </p>
      )}
    </div>
  );

  const renderVideoViewer = () => (
    <div className="relative">
      <video
        controls
        className="max-w-full max-h-96 rounded-lg"
        poster={attachment.thumbnail_url}
      >
        <source src={attachment.file_url} type={attachment.mime_type} />
        Seu navegador não suporta vídeos.
      </video>
      {attachment.duration && (
        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
          {formatDuration(attachment.duration)}
        </Badge>
      )}
    </div>
  );

  const renderAudioViewer = () => (
    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-md">
      <div className="flex-shrink-0">
        <Volume2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {attachment.file_name}
        </p>
        <audio controls className="w-full mt-2">
          <source src={attachment.file_url} type={attachment.mime_type} />
          Seu navegador não suporta áudio.
        </audio>
      </div>
      <Button size="sm" variant="ghost" onClick={handleDownload}>
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderPDFViewer = () => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-md">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded flex items-center justify-center">
          <FileText className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {attachment.file_name}
          </p>
          <p className="text-xs text-gray-500">
            {formatSize(attachment.file_size)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(attachment.file_url, '_blank')}
          >
            Abrir
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderGenericViewer = () => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-md">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
          <File className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {attachment.file_name}
          </p>
          <p className="text-xs text-gray-500">
            {formatSize(attachment.file_size)}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderInline = () => {
    if (attachment.mime_type.startsWith('image/')) {
      return renderImageViewer();
    }
    if (attachment.mime_type.startsWith('video/')) {
      return renderVideoViewer();
    }
    if (attachment.mime_type.startsWith('audio/')) {
      return renderAudioViewer();
    }
    if (attachment.mime_type === 'application/pdf') {
      return renderPDFViewer();
    }
    return renderGenericViewer();
  };

  return (
    <>
      {showInline && renderInline()}

      {isModalOpen && attachment.mime_type.startsWith('image/') && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <img
              src={attachment.file_url}
              alt={attachment.file_name}
              style={{ transform: `scale(${zoom / 100})` }}
              className="max-w-full max-h-[90vh] object-contain transition-transform"
            />
            <p className="text-white text-center mt-4 text-sm">
              {attachment.file_name} - {formatSize(attachment.file_size)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

import { FileText, File, Badge } from 'lucide-react';
