'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Tablet, Monitor, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DevicePreviewProps {
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  username?: string;
  avatarUrl?: string;
  likes?: number;
  comments?: number;
  platform?: 'instagram' | 'facebook' | 'linkedin' | 'tiktok';
  postType?: 'feed' | 'story' | 'reel';
}

type DeviceType = 'phone' | 'tablet' | 'desktop';

export function DevicePreview({
  imageUrl,
  videoUrl,
  caption = 'Legenda do post...',
  username = 'minha_marca',
  avatarUrl,
  likes = 1234,
  comments = 56,
  platform = 'instagram',
  postType = 'feed'
}: DevicePreviewProps) {
  const [device, setDevice] = useState<DeviceType>('phone');

  const deviceDimensions = {
    phone: { width: 375, height: 812, scale: 0.7 },
    tablet: { width: 768, height: 1024, scale: 0.5 },
    desktop: { width: 1200, height: 800, scale: 0.4 }
  };

  const getDeviceFrame = () => {
    const dims = deviceDimensions[device];
    return {
      width: dims.width * dims.scale,
      height: dims.height * dims.scale
    };
  };

  const frame = getDeviceFrame();

  return (
    <div className="flex flex-col items-center">
      {/* Device Selector */}
      <div className="flex gap-2 mb-4">
        {[
          { type: 'phone' as DeviceType, icon: Smartphone, label: 'Celular' },
          { type: 'tablet' as DeviceType, icon: Tablet, label: 'Tablet' },
          { type: 'desktop' as DeviceType, icon: Monitor, label: 'Desktop' }
        ].map(d => (
          <Button
            key={d.type}
            variant={device === d.type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice(d.type)}
            className={device === d.type ? 'bg-primary' : ''}
          >
            <d.icon className="w-4 h-4 mr-2" />
            {d.label}
          </Button>
        ))}
      </div>

      {/* Device Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={device}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="relative"
          style={{ width: frame.width, height: frame.height }}
        >
          {/* Phone Frame */}
          {device === 'phone' && (
            <div className="absolute inset-0 bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
              {/* Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
              
              {/* Screen */}
              <div className="relative h-full bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden">
                {/* Status Bar */}
                <div className="h-8 bg-white dark:bg-gray-900 flex items-center justify-between px-6 text-xs">
                  <span className="font-medium">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-2 bg-black dark:bg-white rounded-sm" />
                  </div>
                </div>

                {/* Instagram Post Preview */}
                {platform === 'instagram' && postType === 'feed' && (
                  <div className="h-full overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 p-0.5">
                          <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold">{username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-sm">{username}</span>
                      </div>
                      <MoreHorizontal className="w-5 h-5" />
                    </div>

                    {/* Image */}
                    <div className="aspect-square bg-gray-200 dark:bg-gray-800">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : videoUrl ? (
                        <video src={videoUrl} className="w-full h-full object-cover" muted loop autoPlay />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Imagem do post
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
                      <p className="font-semibold text-sm mb-1">{likes.toLocaleString()} curtidas</p>
                      <p className="text-sm">
                        <span className="font-semibold">{username}</span>{' '}
                        <span className="text-gray-700 dark:text-gray-300">{caption.slice(0, 100)}...</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Ver todos os {comments} comentários
                      </p>
                    </div>
                  </div>
                )}

                {/* Instagram Story Preview */}
                {platform === 'instagram' && postType === 'story' && (
                  <div className="h-full bg-black relative">
                    {/* Story progress bars */}
                    <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                      <div className="flex-1 h-0.5 bg-white/50 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-white rounded-full" />
                      </div>
                    </div>
                    
                    {/* User info */}
                    <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-3 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                          {avatarUrl && <img src={avatarUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-white font-medium text-sm">{username}</span>
                        <span className="text-white/60 text-xs">1h</span>
                      </div>
                    </div>

                    {/* Content */}
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50">
                        Conteúdo do Story
                      </div>
                    )}
                  </div>
                )}

                {/* Reel Preview */}
                {platform === 'instagram' && postType === 'reel' && (
                  <div className="h-full bg-black relative">
                    {videoUrl ? (
                      <video src={videoUrl} className="w-full h-full object-cover" muted loop autoPlay />
                    ) : imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50">
                        Conteúdo do Reel
                      </div>
                    )}
                    
                    {/* Right side actions */}
                    <div className="absolute right-3 bottom-20 flex flex-col gap-5 z-10">
                      <div className="flex flex-col items-center">
                        <Heart className="w-7 h-7 text-white" />
                        <span className="text-white text-xs">{likes}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <MessageCircle className="w-7 h-7 text-white" />
                        <span className="text-white text-xs">{comments}</span>
                      </div>
                      <Send className="w-7 h-7 text-white" />
                    </div>

                    {/* Bottom info */}
                    <div className="absolute left-3 right-12 bottom-8 z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                          {avatarUrl && <img src={avatarUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-white font-medium text-sm">{username}</span>
                      </div>
                      <p className="text-white text-sm">{caption.slice(0, 80)}...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tablet Frame */}
          {device === 'tablet' && (
            <div className="absolute inset-0 bg-gray-800 rounded-3xl p-3 shadow-2xl">
              <div className="h-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
                {/* Similar content but scaled */}
                <div className="p-4 h-full flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-gray-400">Preview do conteúdo em tablet</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Frame */}
          {device === 'desktop' && (
            <div className="absolute inset-0 bg-gray-700 rounded-xl shadow-2xl">
              <div className="h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden border-t-8 border-gray-700">
                <div className="p-4 h-full flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-gray-400">Preview do conteúdo em desktop</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Platform & Type info */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {platform.charAt(0).toUpperCase() + platform.slice(1)} • {postType.charAt(0).toUpperCase() + postType.slice(1)}
        </p>
      </div>
    </div>
  );
}
