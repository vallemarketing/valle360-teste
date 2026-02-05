'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Instagram,
  Facebook,
  Linkedin,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Share2,
  Globe,
} from 'lucide-react';

interface PostPreviewProps {
  platform: 'instagram' | 'facebook' | 'linkedin';
  accountName: string;
  accountAvatar?: string;
  copy: string;
  hashtags?: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'carousel';
}

/**
 * PostPreview - Simulates how the post will appear on each platform
 */
export function PostPreview({
  platform,
  accountName,
  accountAvatar,
  copy,
  hashtags = [],
  mediaUrl,
  mediaType = 'image',
}: PostPreviewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook' | 'linkedin'>(platform);

  const fullCaption = hashtags.length > 0 
    ? `${copy}\n\n${hashtags.join(' ')}`
    : copy;

  return (
    <div className="space-y-4">
      {/* Platform tabs */}
      <div className="flex items-center gap-2">
        {(['instagram', 'facebook', 'linkedin'] as const).map((p) => {
          const icons = {
            instagram: Instagram,
            facebook: Facebook,
            linkedin: Linkedin,
          };
          const Icon = icons[p];
          const isActive = selectedPlatform === p;

          return (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--primary-100)' : 'var(--bg-secondary)',
                color: isActive ? 'var(--primary-700)' : 'var(--text-tertiary)',
              }}
            >
              <Icon className="w-4 h-4" />
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Preview container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPlatform}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: selectedPlatform === 'linkedin' ? '#f3f2ef' : 'white',
            borderColor: 'var(--border-light)',
            maxWidth: selectedPlatform === 'instagram' ? '400px' : '500px',
          }}
        >
          {selectedPlatform === 'instagram' && (
            <InstagramPreview
              accountName={accountName}
              accountAvatar={accountAvatar}
              caption={fullCaption}
              mediaUrl={mediaUrl}
            />
          )}

          {selectedPlatform === 'facebook' && (
            <FacebookPreview
              accountName={accountName}
              accountAvatar={accountAvatar}
              caption={fullCaption}
              mediaUrl={mediaUrl}
            />
          )}

          {selectedPlatform === 'linkedin' && (
            <LinkedInPreview
              accountName={accountName}
              accountAvatar={accountAvatar}
              caption={fullCaption}
              mediaUrl={mediaUrl}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Character count */}
      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {copy.length} caracteres
        {selectedPlatform === 'instagram' && copy.length > 2200 && (
          <span className="text-primary ml-2">
            ⚠️ Limite do Instagram: 2200
          </span>
        )}
        {selectedPlatform === 'linkedin' && copy.length > 3000 && (
          <span className="text-primary ml-2">
            ⚠️ Limite do LinkedIn: 3000
          </span>
        )}
      </div>
    </div>
  );
}

function InstagramPreview({
  accountName,
  accountAvatar,
  caption,
  mediaUrl,
}: {
  accountName: string;
  accountAvatar?: string;
  caption: string;
  mediaUrl?: string;
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: '#efefef' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white p-0.5">
              {accountAvatar ? (
                <img src={accountAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200" />
              )}
            </div>
          </div>
          <span className="text-sm font-semibold">{accountName.replace('@', '')}</span>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-800" />
      </div>

      {/* Media */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {mediaUrl ? (
          <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-gray-400 p-4">
            <Instagram className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <span className="text-sm">Imagem do post</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6" />
            <MessageCircle className="w-6 h-6" />
            <Send className="w-6 h-6" />
          </div>
          <Bookmark className="w-6 h-6" />
        </div>

        {/* Likes */}
        <p className="text-sm font-semibold mb-1">1.234 curtidas</p>

        {/* Caption */}
        <p className="text-sm">
          <span className="font-semibold">{accountName.replace('@', '')} </span>
          <span className="whitespace-pre-wrap break-words">
            {caption.length > 150 ? caption.substring(0, 150) + '... mais' : caption}
          </span>
        </p>

        {/* Time */}
        <p className="text-xs text-gray-400 mt-2">HÁ 1 HORA</p>
      </div>
    </div>
  );
}

function FacebookPreview({
  accountName,
  accountAvatar,
  caption,
  mediaUrl,
}: {
  accountName: string;
  accountAvatar?: string;
  caption: string;
  mediaUrl?: string;
}) {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="p-3 flex items-center gap-3">
        {accountAvatar ? (
          <img src={accountAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {accountName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm">{accountName}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Agora mesmo</span>
            <span>•</span>
            <Globe className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        <p className="text-sm whitespace-pre-wrap break-words">
          {caption.length > 250 ? caption.substring(0, 250) + '... Ver mais' : caption}
        </p>
      </div>

      {/* Media */}
      {mediaUrl ? (
        <img src={mediaUrl} alt="Preview" className="w-full" />
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-400 p-4">
            <Facebook className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <span className="text-sm">Mídia do post</span>
          </div>
        </div>
      )}

      {/* Reactions */}
      <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-500 border-b" style={{ borderColor: '#efefef' }}>
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <ThumbsUp className="w-3 h-3 text-white" />
            </div>
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" fill="white" />
            </div>
          </div>
          <span>234</span>
        </div>
        <span>12 comentários • 5 compartilhamentos</span>
      </div>

      {/* Actions */}
      <div className="px-3 py-2 flex items-center justify-around text-gray-600 text-sm font-medium">
        <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100">
          <ThumbsUp className="w-5 h-5" />
          Curtir
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100">
          <MessageCircle className="w-5 h-5" />
          Comentar
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100">
          <Share2 className="w-5 h-5" />
          Compartilhar
        </button>
      </div>
    </div>
  );
}

function LinkedInPreview({
  accountName,
  accountAvatar,
  caption,
  mediaUrl,
}: {
  accountName: string;
  accountAvatar?: string;
  caption: string;
  mediaUrl?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {accountAvatar ? (
          <img src={accountAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {accountName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{accountName}</p>
          <p className="text-xs text-gray-500">Título ou descrição • 500+ seguidores</p>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <span>Agora</span>
            <span>•</span>
            <Globe className="w-3 h-3" />
          </div>
        </div>
        <MoreHorizontal className="w-6 h-6 text-gray-600" />
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
          {caption.length > 300 ? caption.substring(0, 300) + '... ver mais' : caption}
        </p>
      </div>

      {/* Media */}
      {mediaUrl ? (
        <img src={mediaUrl} alt="Preview" className="w-full" />
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-400 p-4">
            <Linkedin className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <span className="text-sm">Mídia do post</span>
          </div>
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b" style={{ borderColor: '#e5e5e5' }}>
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <span className="text-sm">👍</span>
            <span className="text-sm">🎉</span>
            <span className="text-sm">❤️</span>
          </div>
          <span className="ml-1">56</span>
        </div>
        <span>8 comentários</span>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between text-gray-600 text-xs font-medium">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100">
          <ThumbsUp className="w-4 h-4" />
          Gostei
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100">
          <MessageCircle className="w-4 h-4" />
          Comentar
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100">
          <Share2 className="w-4 h-4" />
          Compartilhar
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100">
          <Send className="w-4 h-4" />
          Enviar
        </button>
      </div>
    </div>
  );
}

export default PostPreview;
