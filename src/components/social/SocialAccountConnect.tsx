'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Instagram, Facebook, Linkedin, Twitter, Youtube,
  Check, X, RefreshCw, AlertTriangle, Shield,
  ExternalLink, Unlink, Settings
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
  username: string;
  displayName: string;
  profileImage?: string;
  connected: boolean;
  connectedAt?: Date;
  expiresAt?: Date;
  permissions: string[];
  status: 'active' | 'expired' | 'error';
}

interface SocialAccountConnectProps {
  clientId: string;
  accounts?: SocialAccount[];
  onConnect?: (platform: string) => void;
  onDisconnect?: (accountId: string) => void;
  onRefresh?: (accountId: string) => void;
  isClientView?: boolean;
}

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="w-6 h-6" />,
    color: '#E4405F',
    gradient: 'from-purple-500 via-pink-500 to-amber-400',
    permissions: ['Publicar posts', 'Agendar stories', 'Acessar métricas'],
    oauthUrl: '/api/oauth/instagram'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-6 h-6" />,
    color: '#1877F2',
    gradient: 'from-blue-600 to-blue-500',
    permissions: ['Publicar na página', 'Acessar insights', 'Gerenciar comentários'],
    oauthUrl: '/api/oauth/facebook'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin className="w-6 h-6" />,
    color: '#0A66C2',
    gradient: 'from-blue-700 to-blue-600',
    permissions: ['Publicar posts', 'Compartilhar artigos'],
    oauthUrl: '/api/oauth/linkedin'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: <Twitter className="w-6 h-6" />,
    color: '#1DA1F2',
    gradient: 'from-sky-500 to-sky-400',
    permissions: ['Publicar tweets', 'Acessar timeline'],
    oauthUrl: '/api/oauth/twitter'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: <Youtube className="w-6 h-6" />,
    color: '#FF0000',
    gradient: 'from-red-600 to-red-500',
    permissions: ['Publicar vídeos', 'Acessar analytics'],
    oauthUrl: '/api/oauth/youtube'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <span className="text-xl">📱</span>,
    color: '#000000',
    gradient: 'from-gray-900 to-gray-800',
    permissions: ['Publicar vídeos'],
    oauthUrl: '/api/oauth/tiktok'
  }
];

export function SocialAccountConnect({
  clientId,
  accounts = [],
  onConnect,
  onDisconnect,
  onRefresh,
  isClientView = false
}: SocialAccountConnectProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(a => a.platform === platformId);
  };

  const handleConnect = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;

    // Mostrar modal de permissões primeiro
    setSelectedPlatform(platformId);
    setShowPermissions(true);
  };

  const confirmConnect = () => {
    if (selectedPlatform) {
      // Redirecionar para OAuth
      onConnect?.(selectedPlatform);
      
      // Em produção, redirecionaria para:
      // window.location.href = `${platform.oauthUrl}?client_id=${clientId}`;
    }
    setShowPermissions(false);
    setSelectedPlatform(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Conectado', className: 'bg-success-50 text-success-700 border-success-200' };
      case 'expired':
        return { label: 'Expirado', className: 'bg-danger-50 text-danger-700 border-danger-200' };
      case 'error':
        return { label: 'Erro', className: 'bg-warning-50 text-warning-800 border-warning-200' };
      default:
        return { label: 'Desconectado', className: 'bg-muted text-muted-foreground border-border' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {isClientView ? 'Minhas Redes Sociais' : 'Redes Sociais do Cliente'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Conecte suas contas para agendar publicações
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary border border-primary/20">
          <Shield className="w-4 h-4" />
          Conexão segura via OAuth
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((platform) => {
          const account = getAccountForPlatform(platform.id);
          const status = account ? getStatusBadge(account.status) : null;

          return (
            <motion.div
              key={platform.id}
              whileHover={{ y: -4 }}
              className="rounded-xl border border-border overflow-hidden bg-card"
            >
              {/* Header with gradient */}
              <div 
                className={`p-4 bg-gradient-to-r ${platform.gradient}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{platform.name}</h3>
                      {account?.connected && (
                        <p className="text-xs text-white/80">{account.username}</p>
                      )}
                    </div>
                  </div>
                  
                  {status && (
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${status.className}`}>
                      {status.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {account?.connected ? (
                  <div className="space-y-3">
                    {/* Account Info */}
                    <div className="flex items-center gap-3">
                      {account.profileImage && (
                        <img 
                          src={account.profileImage}
                          alt={account.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {account.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Conectado em {account.connectedAt?.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Expiration Warning */}
                    {account.status === 'expired' && (
                      <div className="flex items-center gap-2 p-2 rounded-lg text-xs bg-danger-50 text-danger-700 border border-danger-200">
                        <AlertTriangle className="w-4 h-4" />
                        Token expirado. Reconecte para continuar.
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {account.status === 'expired' ? (
                        <button
                          onClick={() => onRefresh?.(account.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-valle-primary hover:bg-valle-primary-dark transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reconectar
                        </button>
                      ) : (
                        <button
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Configurar
                        </button>
                      )}
                      <button
                        onClick={() => onDisconnect?.(account.id)}
                        className="p-2 rounded-lg bg-danger-50 text-danger-700 hover:bg-danger-100 transition-colors"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Conecte sua conta para agendar publicações automaticamente.
                    </p>
                    <button
                      onClick={() => handleConnect(platform.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: platform.color }}
                    >
                      Conectar {platform.name}
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Permissions Modal */}
      <AnimatePresence>
        {showPermissions && selectedPlatform && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPermissions(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl z-50 bg-card border border-border text-foreground shadow-2xl"
            >
              {(() => {
                const platform = PLATFORMS.find(p => p.id === selectedPlatform);
                if (!platform) return null;

                return (
                  <>
                    <div className="text-center mb-6">
                      <div 
                        className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-r ${platform.gradient}`}
                      >
                        <div className="text-white">{platform.icon}</div>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        Conectar {platform.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        A Valle 360 solicita as seguintes permissões:
                      </p>
                    </div>

                    <div className="space-y-2 mb-6">
                      {platform.permissions.map((permission, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{}}
                        >
                          <Check className="w-5 h-5 text-success-600" />
                          <span className="text-sm text-foreground">
                            {permission}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div 
                      className="flex items-start gap-2 p-3 rounded-lg mb-6"
                      style={{ backgroundColor: 'var(--info-100)' }}
                    >
                      <Shield className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--info-600)' }} />
                      <p className="text-xs" style={{ color: 'var(--info-700)' }}>
                        Sua senha nunca é compartilhada conosco. A conexão é feita de forma segura via OAuth.
                        Você pode revogar o acesso a qualquer momento.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPermissions(false)}
                        className="flex-1 px-4 py-2 rounded-xl font-medium"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmConnect}
                        className="flex-1 px-4 py-2 rounded-xl font-medium text-white"
                        style={{ backgroundColor: platform.color }}
                      >
                        Conectar
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SocialAccountConnect;









