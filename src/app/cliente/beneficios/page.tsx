'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Star, Share2, Trophy, Copy, Check, Users, Calendar, DollarSign, Loader2 } from 'lucide-react';

interface Referral {
  id: string;
  referred_name: string | null;
  referred_email: string;
  status: 'pending' | 'active' | 'paid';
  created_at: string;
  earnings: number;
}

interface Benefit {
  id: string;
  name: string;
  description: string;
  credits_required: number;
  category: string;
  available: boolean;
}

interface BenefitsData {
  referral_code: string;
  referral_url: string;
  referrals: Referral[];
  stats: {
    total_referrals: number;
    active_referrals: number;
    total_earnings: number;
  };
  level: {
    name: string;
    discount: number;
  };
  available_benefits: Benefit[];
}

export default function BeneficiosPage() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BenefitsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/client/benefits', { cache: 'no-store' });
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao carregar benefícios');
        }
        
        setData(json);
      } catch (e: any) {
        setError(e.message);
        console.error('Error fetching benefits:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const referrals = data?.referrals || [];
  const totalEarnings = data?.stats?.total_earnings || 0;
  const activeReferrals = data?.stats?.active_referrals || 0;
  const referralUrl = data?.referral_url || '';
  const level = data?.level?.name || 'Bronze';
  const levelDiscount = data?.level?.discount || 0;
  const availableBenefits = data?.available_benefits || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Erro: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: Referral['status']) => {
    const statusConfig: Record<Referral['status'], { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Ativo', className: 'bg-green-100 text-green-700' },
      paid: { label: 'Pago', className: 'bg-blue-100 text-blue-700' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Benefícios</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Programa de indicações e vantagens exclusivas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-700 dark:text-gray-300">
              Total de Indicações
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{activeReferrals}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Clientes ativos indicados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-700 dark:text-gray-300">
              Ganhos Totais
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              R$ {totalEarnings.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Em créditos acumulados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Nível</CardTitle>
            <Trophy className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{level}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {levelDiscount}% de desconto em serviços
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <CardTitle>Seu Link de Indicação</CardTitle>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Compartilhe e ganhe <span className="font-bold text-primary">R$ 500</span> em créditos
            para cada cliente que se tornar ativo!
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
            <Button
              onClick={handleCopy}
              className="bg-primary hover:bg-[#1260b5] flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas Indicações</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Acompanhe o status de cada indicação
          </p>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Nenhuma indicação ainda</p>
              <p className="text-sm mt-1">Compartilhe seu link para começar a ganhar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-primary transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {referral.referred_name || 'Indicado'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {referral.referred_email}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        {referral.status !== 'pending' && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <DollarSign className="w-3 h-3" />
                            R$ {referral.earnings}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(referral.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefícios Disponíveis</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Use seus créditos para resgatar vantagens
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableBenefits.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nenhum benefício disponível no momento.
            </p>
          ) : (
            availableBenefits.map((benefit) => {
              const Icon = benefit.category === 'premium' ? Trophy : benefit.category === 'service' ? Star : Gift;
              return (
                <div
                  key={benefit.id}
                  className={`flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-300 transition-all ${!benefit.available ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${benefit.available ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{benefit.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {benefit.description}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        R$ {benefit.credits_required.toLocaleString('pt-BR')} em créditos
                      </Badge>
                    </div>
                  </div>
                  {benefit.available ? (
                    <Button className="bg-primary hover:bg-[#1260b5]">Resgatar</Button>
                  ) : (
                    <Button variant="outline" disabled>
                      Em breve
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
