'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  Link2,
  Link2Off,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Loader2,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdAccount {
  id: string;
  platform: 'meta' | 'google';
  account_id: string;
  account_name: string;
  connected_at: string;
  is_active: boolean;
  metrics?: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

const PLATFORM_CONFIG = {
  meta: {
    name: 'Meta Ads',
    icon: '📘',
    color: '#1877F2',
    description: 'Facebook e Instagram Ads',
    authUrl: '/api/oauth/meta/ads/authorize',
  },
  google: {
    name: 'Google Ads',
    icon: '🔍',
    color: '#4285F4',
    description: 'Google Search, Display e YouTube',
    authUrl: '/api/oauth/google/ads/authorize',
  },
};

export default function ClienteAnunciosPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/ad-accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to fetch ad accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (platform: 'meta' | 'google') => {
    setConnecting(platform);
    const config = PLATFORM_CONFIG[platform];
    window.location.href = `${config.authUrl}?redirect=/cliente/redes/anuncios`;
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja desconectar esta conta?')) return;
    
    try {
      const res = await fetch(`/api/client/ad-accounts/${accountId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAccounts(accounts.filter(a => a.id !== accountId));
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error);
    }
  };

  const getAccountByPlatform = (platform: string) => {
    return accounts.find(a => a.platform === platform && a.is_active);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1672d6]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-[#001533] dark:text-white mb-2">
          Contas de Anúncios
        </h1>
        <p className="text-[#001533]/60 dark:text-white/60">
          Conecte suas contas para acompanhar métricas de campanhas
        </p>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
      >
        <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-emerald-700 dark:text-emerald-300">
            Conexão Segura via OAuth
          </p>
          <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Suas credenciais nunca são armazenadas. Usamos autenticação oficial de cada plataforma.
            Você pode revogar o acesso a qualquer momento.
          </p>
        </div>
      </motion.div>

      {/* Platform Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {(Object.entries(PLATFORM_CONFIG) as [keyof typeof PLATFORM_CONFIG, typeof PLATFORM_CONFIG[keyof typeof PLATFORM_CONFIG]][]).map(([key, platform], index) => {
          const account = getAccountByPlatform(key);
          const isConnected = !!account;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className={cn(
                "relative overflow-hidden border-2 transition-all",
                isConnected 
                  ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10" 
                  : "border-[#001533]/10 dark:border-white/10"
              )}>
                {/* Platform Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${platform.color}15` }}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                        <p className="text-sm text-[#001533]/60 dark:text-white/60">
                          {platform.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        isConnected
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-gray-500/10 text-gray-600 border-gray-500/30"
                      )}
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Conectado
                        </>
                      ) : (
                        <>
                          <Link2Off className="w-3 h-3 mr-1" />
                          Desconectado
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {isConnected && account ? (
                    <div className="space-y-4">
                      {/* Account Info */}
                      <div className="p-3 rounded-lg bg-white dark:bg-[#001533] border border-[#001533]/10 dark:border-white/10">
                        <p className="font-medium text-sm">{account.account_name}</p>
                        <p className="text-xs text-[#001533]/50 dark:text-white/50">
                          ID: {account.account_id} • Conectado em {new Date(account.connected_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Metrics */}
                      {account.metrics && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-white dark:bg-[#001533]">
                            <div className="flex items-center gap-2 text-xs text-[#001533]/60 dark:text-white/60 mb-1">
                              <DollarSign className="w-3 h-3" />
                              Investido
                            </div>
                            <p className="font-bold" style={{ color: platform.color }}>
                              {formatCurrency(account.metrics.spend)}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-white dark:bg-[#001533]">
                            <div className="flex items-center gap-2 text-xs text-[#001533]/60 dark:text-white/60 mb-1">
                              <Eye className="w-3 h-3" />
                              Impressões
                            </div>
                            <p className="font-bold">{formatNumber(account.metrics.impressions)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white dark:bg-[#001533]">
                            <div className="flex items-center gap-2 text-xs text-[#001533]/60 dark:text-white/60 mb-1">
                              <MousePointer className="w-3 h-3" />
                              Cliques
                            </div>
                            <p className="font-bold">{formatNumber(account.metrics.clicks)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white dark:bg-[#001533]">
                            <div className="flex items-center gap-2 text-xs text-[#001533]/60 dark:text-white/60 mb-1">
                              <TrendingUp className="w-3 h-3" />
                              Conversões
                            </div>
                            <p className="font-bold">{formatNumber(account.metrics.conversions)}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={fetchAccounts}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Atualizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600/30 hover:bg-red-50"
                          onClick={() => disconnectAccount(account.id)}
                        >
                          <Link2Off className="w-4 h-4 mr-1" />
                          Desconectar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-[#001533]/60 dark:text-white/60">
                        Conecte sua conta para visualizar métricas de campanhas em tempo real.
                      </p>
                      <Button
                        className="w-full"
                        style={{ backgroundColor: platform.color }}
                        onClick={() => connectAccount(key)}
                        disabled={connecting === key}
                      >
                        {connecting === key ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4 mr-2" />
                        )}
                        Conectar {platform.name}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-[#001533]/5 dark:bg-white/5 border border-[#001533]/10 dark:border-white/10"
      >
        <h3 className="font-semibold text-[#001533] dark:text-white mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Por que conectar minhas contas?
        </h3>
        <ul className="text-sm text-[#001533]/60 dark:text-white/60 space-y-1">
          <li>• Acompanhe o desempenho das suas campanhas em tempo real</li>
          <li>• Receba alertas automáticos sobre orçamento e performance</li>
          <li>• Visualize métricas consolidadas no seu dashboard</li>
          <li>• Permite que nossa equipe otimize suas campanhas com mais eficiência</li>
        </ul>
      </motion.div>
    </div>
  );
}
