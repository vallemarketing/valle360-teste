'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paperclip, X, Image, Video, Music, FileText, File, Loader2 } from 'lucide-react';

interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  error?: string;
}

interface AttachmentUploadProps {
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export function AttachmentUpload({
  onAttachmentsChange,
  maxFiles = 5,
  maxSizeInMB = 50,
}: AttachmentUploadProps) {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (mimeType: string): AttachmentFile['type'] => {
    if (ALLOWED_TYPES.image.includes(mimeType)) return 'image';
    if (ALLOWED_TYPES.video.includes(mimeType)) return 'video';
    if (ALLOWED_TYPES.audio.includes(mimeType)) return 'audio';
    if (ALLOWED_TYPES.document.includes(mimeType)) return 'document';
    return 'other';
  };

  const validateFile = (file: File): string | null => {
    const maxSize = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo: ${maxSizeInMB}MB`;
    }

    const allAllowedTypes = [
      ...ALLOWED_TYPES.image,
      ...ALLOWED_TYPES.video,
      ...ALLOWED_TYPES.audio,
      ...ALLOWED_TYPES.document,
    ];

    if (!allAllowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado';
    }

    return null;
  };

  const createPreview = (file: File, type: AttachmentFile['type']): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (type === 'image') {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (attachments.length + files.length > maxFiles) {
      alert(`Você pode anexar no máximo ${maxFiles} arquivos por vez`);
      return;
    }

    setIsUploading(true);

    const newAttachments: AttachmentFile[] = [];

    for (const file of files) {
      const error = validateFile(file);
      const type = getFileType(file.type);
      const preview = await createPreview(file, type);

      newAttachments.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        type,
        preview,
        error: error || undefined,
      });
    }

    const updatedAttachments = [...attachments, ...newAttachments];
    setAttachments(updatedAttachments);
    onAttachmentsChange(updatedAttachments);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    const updated = attachments.filter(a => a.id !== id);
    setAttachments(updated);
    onAttachmentsChange(updated);
  };

  const getIcon = (type: AttachmentFile['type']) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || attachments.length >= maxFiles}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || attachments.length >= maxFiles}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </Button>

        {attachments.length > 0 && (
          <Badge variant="outline">
            {attachments.length} arquivo{attachments.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`flex items-center gap-2 p-2 rounded-lg border ${
                attachment.error
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              {attachment.preview && attachment.type === 'image' ? (
                <img
                  src={attachment.preview}
                  alt={attachment.file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                  {getIcon(attachment.type)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {attachment.file.name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    {formatSize(attachment.file.size)}
                  </p>
                  {attachment.error && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {attachment.error}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(attachment.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
