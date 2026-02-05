'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Link2,
  Unlink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui';

interface SocialConnection {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  account_avatar?: string;
  is_active: boolean;
  connected_at: string;
  connected_by_role: string;
  token_expires_at?: string;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: '#000000' },
];

export default function RedesSociaisPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [disconnectModal, setDisconnectModal] = useState<{ open: boolean; connection: SocialConnection | null }>({
    open: false,
    connection: null,
  });
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState('');

  useEffect(() => {
    loadConnections();

    // Check for OAuth callback messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const connected = searchParams.get('connected');

    if (success === 'true') {
      toast.success(`${connected || 1} conta(s) conectada(s) com sucesso!`);
    } else if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [clientId, searchParams]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/client/${clientId}/social-connections`);
      const data = await response.json();

      if (response.ok) {
        setConnections(data.connections || []);
      } else {
        throw new Error(data.error || 'Erro ao carregar conexões');
      }
    } catch (e: any) {
      console.error('Erro ao carregar conexões:', e);
      toast.error(e.message || 'Erro ao carregar conexões');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    // Redirect to OAuth authorize endpoint
    if (platform === 'instagram' || platform === 'facebook') {
      window.location.href = `/api/oauth/meta/authorize?client_id=${clientId}`;
    } else if (platform === 'linkedin') {
      window.location.href = `/api/oauth/linkedin/authorize?client_id=${clientId}`;
    } else {
      toast.info(`Conexão com ${platform} em breve!`);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectModal.connection) return;

    setDisconnecting(true);
    try {
      const platform = disconnectModal.connection.platform;
      const endpoint = platform === 'linkedin'
        ? '/api/oauth/linkedin/revoke'
        : '/api/oauth/meta/revoke';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: disconnectModal.connection.id,
          reason: disconnectReason || 'Desconectado pelo usuário',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Conta desconectada com sucesso');
        setDisconnectModal({ open: false, connection: null });
        setDisconnectReason('');
        loadConnections();
      } else {
        throw new Error(data.error || 'Erro ao desconectar');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  const getConnectionForPlatform = (platformId: string) => {
    return connections.find(c => c.platform === platformId && c.is_active);
  };

  const isTokenExpiring = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7;
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary-50)' }}
            >
              <Link2 className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Redes Sociais
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Conecte suas contas para publicação automática
              </p>
            </div>
          </div>

          <button
            onClick={loadConnections}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Security Notice */}
        <div
          className="p-4 rounded-xl border flex items-start gap-3"
          style={{ backgroundColor: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}
        >
          <Shield className="w-5 h-5 mt-0.5" style={{ color: 'var(--primary-600)' }} />
          <div>
            <p className="font-medium" style={{ color: 'var(--primary-700)' }}>
              Conexão segura via OAuth
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--primary-600)' }}>
              Suas credenciais nunca são armazenadas. Usamos autenticação oficial de cada plataforma
              e você pode revogar o acesso a qualquer momento.
            </p>
          </div>
        </div>

        {/* Platforms */}
        {loading ? (
          <div
            className="p-8 rounded-2xl border text-center"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{ color: 'var(--primary-500)' }} />
            <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
              Carregando conexões...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const connection = getConnectionForPlatform(platform.id);
              const isConnected = !!connection;
              const expiring = connection && isTokenExpiring(connection.token_expires_at);

              return (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border p-5"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: isConnected ? 'var(--success-200)' : 'var(--border-light)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${platform.color}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: platform.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {platform.name}
                          </span>
                          {isConnected && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                              style={{
                                backgroundColor: expiring ? 'var(--warning-100)' : 'var(--success-100)',
                                color: expiring ? 'var(--warning-700)' : 'var(--success-700)',
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {expiring ? 'Token expirando' : 'Conectado'}
                            </span>
                          )}
                        </div>
                        {isConnected && connection && (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {connection.account_name} • Conectado em{' '}
                            {new Date(connection.connected_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <>
                          {expiring && (
                            <button
                              onClick={() => handleConnect(platform.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
                              style={{
                                backgroundColor: 'var(--warning-100)',
                                color: 'var(--warning-700)',
                              }}
                            >
                              <RefreshCw className="w-4 h-4" />
                              Reconectar
                            </button>
                          )}
                          <button
                            onClick={() => setDisconnectModal({ open: true, connection })}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium border"
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                              borderColor: 'var(--border-light)',
                              color: 'var(--error-600)',
                            }}
                          >
                            <Unlink className="w-4 h-4" />
                            Desconectar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
                          style={{ backgroundColor: platform.color }}
                        >
                          <Link2 className="w-4 h-4" />
                          Conectar
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Disconnect Modal */}
        <ConfirmModal
          isOpen={disconnectModal.open}
          onClose={() => {
            if (!disconnecting) {
              setDisconnectModal({ open: false, connection: null });
              setDisconnectReason('');
            }
          }}
          onConfirm={handleDisconnect}
          title="Desconectar conta"
          message={
            <div className="space-y-4">
              <p>
                Tem certeza que deseja desconectar{' '}
                <strong>{disconnectModal.connection?.account_name}</strong>?
              </p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Você não poderá mais publicar nesta conta até conectá-la novamente.
              </p>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={disconnectReason}
                  onChange={(e) => setDisconnectReason(e.target.value)}
                  placeholder="Ex: Mudança de conta, teste..."
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          }
          confirmText="Desconectar"
          cancelText="Cancelar"
          variant="danger"
          loading={disconnecting}
        />
      </div>
    </div>
  );
}
