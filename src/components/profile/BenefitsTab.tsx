'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Award, Users, Sparkles, Gift, TrendingUp, Ticket, Clock, Check, Copy } from 'lucide-react';
import type { ClientBenefit } from '@/types';

interface BenefitsTabProps {
  userId: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  description: string;
  expires_at: string;
  is_used: boolean;
  used_at?: string;
}

interface Redemption {
  id: string;
  benefit_type: string;
  description: string;
  redeemed_at: string;
  value: number;
}

export default function BenefitsTab({ userId }: BenefitsTabProps) {
  const [benefits, setBenefits] = useState<ClientBenefit[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadBenefits();
    loadCoupons();
    loadRedemptions();
  }, [userId]);

  const loadBenefits = async () => {
    try {
      const { data, error } = await supabase
        .from('client_benefits')
        .select('*')
        .eq('client_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    const mockCoupons: Coupon[] = [
      {
        id: '1',
        code: 'VALLE360-BLACK25',
        discount_percentage: 25,
        description: 'Cupom Black Friday - 25% de desconto em qualquer serviço',
        expires_at: '2025-12-31',
        is_used: false
      },
      {
        id: '2',
        code: 'VALLE-FIDELIDADE15',
        discount_percentage: 15,
        description: 'Cupom de Fidelidade - 15% na renovação do contrato',
        expires_at: '2025-12-31',
        is_used: false
      },
      {
        id: '3',
        code: 'INDICACAO-PREMIO',
        discount_percentage: 30,
        description: 'Cupom por indicação aprovada - 30% off no próximo mês',
        expires_at: '2025-11-30',
        is_used: true,
        used_at: '2025-10-15'
      }
    ];
    setCoupons(mockCoupons);
  };

  const loadRedemptions = async () => {
    const mockRedemptions: Redemption[] = [
      {
        id: '1',
        benefit_type: 'Cupom de Indicação',
        description: 'Desconto de 30% aplicado na fatura de Outubro/2025',
        redeemed_at: '2025-10-15',
        value: 1500
      },
      {
        id: '2',
        benefit_type: 'Crédito Extra',
        description: 'Crédito de R$ 500 por indicação aprovada',
        redeemed_at: '2025-09-20',
        value: 500
      },
      {
        id: '3',
        benefit_type: 'Desconto Fidelidade',
        description: 'Desconto de 10% por 12 meses de contrato',
        redeemed_at: '2025-06-01',
        value: 600
      }
    ];
    setRedemptions(mockRedemptions);
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const referralBenefit = benefits.find(b => b.benefit_type === 'referral_discount');
  const totalDiscount = benefits.reduce((sum, b) => sum + b.benefit_value, 0);

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'loyalty_discount':
        return Award;
      case 'referral_discount':
        return Users;
      case 'annual_payment_discount':
        return Sparkles;
      default:
        return Gift;
    }
  };

  const getBenefitColor = (type: string) => {
    switch (type) {
      case 'loyalty_discount':
        return 'blue';
      case 'referral_discount':
        return 'green';
      case 'annual_payment_discount':
        return 'yellow';
      default:
        return 'purple';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando benefícios...</div>;
  }

  return (
    <div className="space-y-6">
      {referralBenefit && (
        <Card className="border-2 border-yellow-300 bg-gradient-to-br from-white to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-valle-navy-900">Programa de Indicações</h3>
                <p className="text-valle-silver-600">Ganhe benefícios indicando novos clientes</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
                <p className="text-sm text-valle-silver-600 mb-1">Clientes Indicados</p>
                <p className="text-3xl font-bold text-yellow-600">{referralBenefit.referral_count}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                <p className="text-sm text-valle-silver-600 mb-1">Desconto Acumulado</p>
                <p className="text-3xl font-bold text-green-600">{referralBenefit.benefit_value}%</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-xl border-2 border-yellow-200">
              <p className="text-sm font-semibold text-valle-navy-800 mb-2">Seu Link de Indicação:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`https://valle360.com/indicacao/${userId}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-valle-silver-50 border border-valle-silver-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://valle360.com/indicacao/${userId}`);
                    alert('Link copiado!');
                  }}
                  className="px-4 py-2 bg-valle-blue-600 text-white rounded-lg hover:bg-valle-blue-700 text-sm font-medium"
                >
                  Copiar
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Benefícios Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {benefits.length === 0 ? (
            <p className="text-center text-valle-silver-500 py-8">Nenhum benefício ativo no momento</p>
          ) : (
            <div className="space-y-3">
              {benefits.map((benefit) => {
                const Icon = getBenefitIcon(benefit.benefit_type);
                const color = getBenefitColor(benefit.benefit_type);

                return (
                  <div
                    key={benefit.id}
                    className="flex items-center justify-between p-4 bg-valle-silver-50 rounded-lg border border-valle-silver-200 hover:border-valle-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${color}-600`} />
                      </div>
                      <div>
                        <p className="font-medium text-valle-navy-800">{benefit.benefit_name}</p>
                        <p className="text-xs text-valle-silver-600">
                          Ativo desde {new Date(benefit.start_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                      {benefit.benefit_value}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {benefits.length > 0 && (
            <div className="mt-6 p-6 bg-valle-blue-50 border-2 border-valle-blue-200 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-valle-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-valle-navy-800">Desconto Total Aplicado:</p>
                  <p className="text-4xl font-bold text-valle-blue-600">{totalDiscount}%</p>
                </div>
              </div>
              <p className="text-sm text-valle-silver-700">
                Você está economizando aproximadamente{' '}
                <span className="font-bold text-green-600">
                  R$ {((5999 * totalDiscount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                /mês com seus benefícios ativos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-valle-blue-600" />
              Meus Cupons
            </CardTitle>
            <Badge className="bg-valle-blue-600 text-white">{coupons.filter(c => !c.is_used).length} disponíveis</Badge>
          </div>
          <p className="text-sm text-valle-silver-600 mt-1">Seus cupons de desconto exclusivos</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  coupon.is_used
                    ? 'bg-valle-silver-50 border-valle-silver-200 opacity-60'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-400'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`px-3 py-1 rounded-lg font-mono font-bold text-sm ${
                        coupon.is_used ? 'bg-valle-silver-200 text-valle-silver-600' : 'bg-green-600 text-white'
                      }`}>
                        {coupon.code}
                      </div>
                      <Badge className={coupon.is_used ? 'bg-valle-silver-400' : 'bg-green-600'}>
                        {coupon.discount_percentage}% OFF
                      </Badge>
                      {coupon.is_used && (
                        <Badge className="bg-red-600 text-white flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Usado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-valle-navy-700 mb-1">{coupon.description}</p>
                    <div className="flex items-center gap-4 text-xs text-valle-silver-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {coupon.is_used
                          ? `Usado em ${new Date(coupon.used_at!).toLocaleDateString('pt-BR')}`
                          : `Válido até ${new Date(coupon.expires_at).toLocaleDateString('pt-BR')}`
                        }
                      </span>
                    </div>
                  </div>
                  {!coupon.is_used && (
                    <Button
                      onClick={() => copyCouponCode(coupon.code)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-valle-blue-600" />
            Histórico de Resgates
          </CardTitle>
          <p className="text-sm text-valle-silver-600 mt-1">Benefícios que você já utilizou</p>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <p className="text-center text-valle-silver-500 py-8">Nenhum resgate realizado ainda</p>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {redemptions.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-start justify-between p-4 bg-valle-blue-50 rounded-lg border border-valle-blue-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-valle-blue-600 text-white">{redemption.benefit_type}</Badge>
                        <span className="text-xs text-valle-silver-600">
                          {new Date(redemption.redeemed_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-valle-navy-700">{redemption.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        R$ {redemption.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-valle-silver-600">economizados</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-valle-navy-800 mb-1">Total Economizado com Benefícios:</p>
                    <p className="text-4xl font-bold text-green-600">
                      R$ {redemptions.reduce((sum, r) => sum + r.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
