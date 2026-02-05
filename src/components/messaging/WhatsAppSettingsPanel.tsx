'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Clock,
  Calendar,
  Bell,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface WhatsAppSettings {
  id?: string;
  is_enabled: boolean;
  api_token: string;
  phone_number: string;
  delay_hours: number;
  business_hours_only: boolean;
  business_start_time: string;
  business_end_time: string;
  exclude_weekends: boolean;
  last_sync_at?: string;
}

interface WhatsAppLog {
  id: string;
  recipient_phone: string;
  message_sent: string;
  status: string;
  sent_at: string;
  error_message?: string;
}

export function WhatsAppSettingsPanel({ currentUserId }: { currentUserId: string }) {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    is_enabled: false,
    api_token: '',
    phone_number: '',
    delay_hours: 2,
    business_hours_only: true,
    business_start_time: '09:00',
    business_end_time: '18:00',
    exclude_weekends: true,
  });
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, [currentUserId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const settingsData = {
        ...settings,
        user_id: currentUserId,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error } = await supabase
          .from('whatsapp_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      alert('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: settings.phone_number,
          message: 'Teste de integração WhatsApp - Valle 360',
          userId: currentUserId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Mensagem de teste enviada com sucesso!',
        });
        loadLogs();
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Erro ao enviar mensagem de teste',
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: 'Erro: ' + error.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Configurações do WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_enabled"
              checked={settings.is_enabled}
              onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_enabled" className="text-sm font-medium">
              Ativar notificações automáticas via WhatsApp
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Token da API WhatsApp</label>
            <Input
              type="password"
              value={settings.api_token}
              onChange={(e) => setSettings({ ...settings, api_token: e.target.value })}
              placeholder="Bearer token da API do WhatsApp Business"
            />
            <p className="text-xs text-gray-500 mt-1">
              Obtenha em: Meta for Developers - WhatsApp Business API
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Número de Telefone</label>
            <Input
              type="tel"
              value={settings.phone_number}
              onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
              placeholder="5511999999999"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tempo de espera antes de notificar
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="48"
                value={settings.delay_hours}
                onChange={(e) => setSettings({ ...settings, delay_hours: parseInt(e.target.value) })}
                className="w-24"
              />
              <span className="text-sm text-gray-600">horas</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="business_hours_only"
                checked={settings.business_hours_only}
                onChange={(e) => setSettings({ ...settings, business_hours_only: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="business_hours_only" className="text-sm font-medium">
                Enviar apenas em horário comercial
              </label>
            </div>

            {settings.business_hours_only && (
              <div className="grid grid-cols-2 gap-4 ml-7">
                <div>
                  <label className="block text-sm font-medium mb-2">Início</label>
                  <Input
                    type="time"
                    value={settings.business_start_time}
                    onChange={(e) => setSettings({ ...settings, business_start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fim</label>
                  <Input
                    type="time"
                    value={settings.business_end_time}
                    onChange={(e) => setSettings({ ...settings, business_end_time: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="exclude_weekends"
              checked={settings.exclude_weekends}
              onChange={(e) => setSettings({ ...settings, exclude_weekends: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="exclude_weekends" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Não enviar aos finais de semana
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Configurações
            </Button>
            <Button
              onClick={handleTest}
              disabled={isTesting || !settings.api_token || !settings.phone_number}
              variant="outline"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              Enviar Teste
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}

          {settings.last_sync_at && (
            <p className="text-xs text-gray-500">
              Última verificação: {formatDate(settings.last_sync_at)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Histórico de Envios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nenhum envio registrado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.recipient_phone}
                      </p>
                      <Badge
                        className={
                          log.status === 'sent' || log.status === 'delivered'
                            ? 'bg-green-600'
                            : log.status === 'failed'
                            ? 'bg-red-600'
                            : 'bg-gray-600'
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {log.message_sent}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(log.sent_at)}
                    </p>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        Erro: {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
