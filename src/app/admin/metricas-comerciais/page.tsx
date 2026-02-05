'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import {
  Target,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Percent,
  Save,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Client {
  id: string;
  full_name: string;
}

export default function AdminMetricasComerciais() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [meetingsScheduled, setMeetingsScheduled] = useState('');
  const [meetingsCompleted, setMeetingsCompleted] = useState('');
  const [clientsClosed, setClientsClosed] = useState('');
  const [revenueGenerated, setRevenueGenerated] = useState('');
  const [conversionRate, setConversionRate] = useState('');
  const [pipelineValue, setPipelineValue] = useState('');
  const [newContracts, setNewContracts] = useState('');
  const [salesCycleDays, setSalesCycleDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('user_type', 'cliente')
      .order('full_name');

    if (data) {
      setClients(data);
    }
  };

  const clearForm = () => {
    setMeetingsScheduled('');
    setMeetingsCompleted('');
    setClientsClosed('');
    setRevenueGenerated('');
    setConversionRate('');
    setPipelineValue('');
    setNewContracts('');
    setSalesCycleDays('');
  };

  const handleSave = async () => {
    if (!selectedClient || !periodStart || !periodEnd) {
      setMessage({
        type: 'error',
        text: 'Por favor, selecione um cliente e defina o período de análise',
      });
      return;
    }

    const meetingsScheduledNum = parseInt(meetingsScheduled) || 0;
    const meetingsCompletedNum = parseInt(meetingsCompleted) || 0;

    if (meetingsCompletedNum > meetingsScheduledNum) {
      setMessage({
        type: 'error',
        text: 'Reuniões realizadas não pode ser maior que reuniões agendadas',
      });
      return;
    }

    const conversionRateNum = parseFloat(conversionRate) || 0;
    if (conversionRateNum < 0 || conversionRateNum > 100) {
      setMessage({
        type: 'error',
        text: 'Taxa de conversão deve estar entre 0 e 100',
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data: session } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('commercial_metrics')
        .insert({
          client_id: selectedClient,
          period_start: periodStart,
          period_end: periodEnd,
          meetings_scheduled: meetingsScheduledNum,
          meetings_completed: meetingsCompletedNum,
          clients_closed: parseInt(clientsClosed) || 0,
          revenue_generated: parseFloat(revenueGenerated) || 0,
          conversion_rate: conversionRateNum,
          pipeline_value: parseFloat(pipelineValue) || 0,
          new_contracts: parseInt(newContracts) || 0,
          sales_cycle_days: parseInt(salesCycleDays) || 0,
          created_by: session.user?.id,
        });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Métricas comerciais salvas com sucesso!',
      });

      clearForm();
      setPeriodStart('');
      setPeriodEnd('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao salvar métricas. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-valle-navy-900">Métricas Comerciais</h1>
        <p className="text-valle-silver-600 mt-2">
          Cadastre e acompanhe as métricas comerciais de cada cliente
        </p>
      </div>

      {message && (
        <Card className={`border-2 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              <p className={`font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-valle-blue-200 bg-gradient-to-r from-valle-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-valle-navy-900">
            <Users className="w-6 h-6 text-valle-blue-600" />
            Selecionar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full h-12 px-4 rounded-lg border-2 border-valle-silver-300 bg-white focus:border-valle-blue-500 focus:ring-2 focus:ring-valle-blue-200 transition-all"
          >
            <option value="">Selecione um cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedClient && (
        <>
          <Card className="border-2 border-valle-silver-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-valle-navy-900">
                <Calendar className="w-5 h-5 text-valle-blue-600" />
                Período de Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-valle-silver-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-valle-navy-900">
                <Target className="w-5 h-5 text-valle-blue-600" />
                Dados Comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-valle-blue-600" />
                    Reuniões Agendadas
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={meetingsScheduled}
                    onChange={(e) => setMeetingsScheduled(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300 text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Reuniões Realizadas
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={meetingsCompleted}
                    onChange={(e) => setMeetingsCompleted(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300 text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    Clientes Fechados
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={clientsClosed}
                    onChange={(e) => setClientsClosed(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300 text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Faturamento Gerado (R$)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={revenueGenerated}
                    onChange={(e) => setRevenueGenerated(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300 text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-valle-blue-600" />
                    Taxa de Conversão (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300 text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Valor em Pipeline (R$)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={pipelineValue}
                    onChange={(e) => setPipelineValue(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300 text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-valle-blue-600" />
                    Novos Contratos em Negociação
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newContracts}
                    onChange={(e) => setNewContracts(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300 text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-valle-blue-600" />
                    Dias do Ciclo de Vendas
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={salesCycleDays}
                    onChange={(e) => setSalesCycleDays(e.target.value)}
                    className="h-12 border-2 border-valle-silver-300 text-lg font-semibold"
                  />
                </div>
              </div>

              {(meetingsScheduled || clientsClosed || revenueGenerated) && (
                <Card className="border-2 border-valle-blue-200 bg-gradient-to-r from-valle-blue-50 to-white mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg text-valle-navy-900">
                      Prévia das Métricas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg border border-valle-silver-200">
                        <p className="text-xs text-valle-silver-600">Reuniões</p>
                        <p className="text-2xl font-bold text-valle-blue-600">
                          {meetingsScheduled || '0'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-valle-silver-200">
                        <p className="text-xs text-valle-silver-600">Fechados</p>
                        <p className="text-2xl font-bold text-green-600">
                          {clientsClosed || '0'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-valle-silver-200">
                        <p className="text-xs text-valle-silver-600">Faturamento</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {revenueGenerated ? parseFloat(revenueGenerated).toLocaleString('pt-BR') : '0'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-valle-silver-200">
                        <p className="text-xs text-valle-silver-600">Conversão</p>
                        <p className="text-2xl font-bold text-valle-blue-600">
                          {conversionRate || '0'}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-12 bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 hover:from-valle-blue-700 hover:to-valle-blue-800 text-white text-lg font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Salvar Métricas
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-8"
                  onClick={clearForm}
                  disabled={saving}
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedClient && (
        <Card className="border-2 border-valle-silver-200">
          <CardContent className="py-16 text-center">
            <Target className="w-16 h-16 mx-auto text-valle-silver-400 mb-4" />
            <p className="text-lg font-semibold text-valle-navy-700">
              Selecione um cliente para começar
            </p>
            <p className="text-sm text-valle-silver-600 mt-2">
              Escolha um cliente acima para cadastrar suas métricas comerciais
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
