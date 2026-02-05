'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CreditCard, TrendingUp, TrendingDown, Download } from 'lucide-react';
import type { ClientCredit } from '@/types';

interface CreditsTabProps {
  userId: string;
}

export default function CreditsTab({ userId }: CreditsTabProps) {
  const [credits, setCredits] = useState<ClientCredit[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, [userId]);

  const loadCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('client_credits')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredits(data || []);
      if (data && data.length > 0) {
        setBalance(data[0].balance_after);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthCredits = credits.filter(c => {
    const date = new Date(c.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const totalUsed = monthCredits
    .filter(c => c.transaction_type === 'usage')
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);

  const totalRecharged = monthCredits
    .filter(c => c.transaction_type === 'recharge')
    .reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return <div className="text-center py-12">Carregando créditos...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-valle-blue-300 bg-gradient-to-br from-white to-valle-blue-50">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-valle-silver-600 mb-2">Saldo Disponível</p>
            <p className="text-5xl font-bold text-valle-blue-600 mb-2">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <Badge className="bg-green-600 text-white">Créditos Ativos</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-white rounded-lg border border-valle-silver-200">
              <p className="text-xs text-valle-silver-600 mb-1">Utilizado</p>
              <p className="text-xl font-bold text-red-600">
                R$ {totalUsed.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-valle-silver-200">
              <p className="text-xs text-valle-silver-600 mb-1">Recarregado</p>
              <p className="text-xl font-bold text-green-600">
                R$ {totalRecharged.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-valle-silver-200">
              <p className="text-xs text-valle-silver-600 mb-1">Uso Mensal</p>
              <p className="text-xl font-bold text-valle-navy-800">
                {totalRecharged > 0 ? Math.round((totalUsed / totalRecharged) * 100) : 0}%
              </p>
            </div>
          </div>

          {balance < 1000 && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-800">
                ⚠️ Saldo baixo! Considere recarregar seus créditos.
              </p>
            </div>
          )}

          <Button className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            Recarregar Créditos
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Créditos</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {credits.length === 0 ? (
              <p className="text-center text-valle-silver-500 py-8">Nenhuma transação encontrada</p>
            ) : (
              credits.slice(0, 20).map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between p-4 bg-valle-silver-50 rounded-lg hover:bg-valle-silver-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        credit.transaction_type === 'recharge' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {credit.transaction_type === 'recharge' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-valle-navy-800">{credit.description}</p>
                      <p className="text-xs text-valle-silver-600">
                        {new Date(credit.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        credit.transaction_type === 'recharge' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {credit.transaction_type === 'recharge' ? '+' : '-'}R${' '}
                      {Math.abs(credit.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-valle-silver-600">
                      Saldo: R$ {credit.balance_after.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
