'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Moon, Sun, Globe, Type, Bell, Mail, LogOut } from 'lucide-react';
import type { UserPreferences } from '@/types';

interface ThemeTabProps {
  userId: string;
}

export default function ThemeTab({ userId }: ThemeTabProps) {
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    theme_mode: 'light',
    language: 'pt',
    font_size: 'medium',
    notifications_new_content: true,
    notifications_messages: true,
    notifications_reports: true,
    notifications_credits: true,
    notifications_system: true,
    email_frequency: 'weekly'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('Preferências salvas com sucesso!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Tem certeza que deseja encerrar sua sessão?')) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="text-center py-12">Carregando preferências...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-valle-blue-600" />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-valle-silver-50 rounded-xl border-2 border-valle-silver-200">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl ${
                  preferences.theme_mode === 'dark' ? 'bg-valle-navy-800' : 'bg-yellow-100'
                } flex items-center justify-center transition-colors`}
              >
                {preferences.theme_mode === 'dark' ? (
                  <Moon className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Sun className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-valle-navy-800">Modo Escuro</h4>
                <p className="text-sm text-valle-silver-600">Ativar tema escuro da interface</p>
              </div>
            </div>
            <button
              onClick={() =>
                setPreferences({
                  ...preferences,
                  theme_mode: preferences.theme_mode === 'dark' ? 'light' : 'dark'
                })
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.theme_mode === 'dark' ? 'bg-valle-blue-600' : 'bg-valle-silver-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  preferences.theme_mode === 'dark' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Idioma
              </label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value as any })}
                className="w-full px-3 py-2 border-2 border-valle-silver-300 rounded-lg focus:border-valle-blue-500 focus:outline-none"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Tamanho da Fonte
              </label>
              <select
                value={preferences.font_size}
                onChange={(e) => setPreferences({ ...preferences, font_size: e.target.value as any })}
                className="w-full px-3 py-2 border-2 border-valle-silver-300 rounded-lg focus:border-valle-blue-500 focus:outline-none"
              >
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-valle-blue-600" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { key: 'notifications_new_content', label: 'Novos conteúdos para aprovação' },
              { key: 'notifications_messages', label: 'Mensagens da equipe Valle' },
              { key: 'notifications_reports', label: 'Relatórios mensais' },
              { key: 'notifications_credits', label: 'Alertas de créditos baixos' },
              { key: 'notifications_system', label: 'Atualizações do sistema' }
            ].map((notification) => (
              <label
                key={notification.key}
                className="flex items-center justify-between p-3 bg-valle-silver-50 rounded-lg cursor-pointer hover:bg-valle-blue-50 transition-colors"
              >
                <span className="text-valle-navy-700">{notification.label}</span>
                <input
                  type="checkbox"
                  checked={preferences[notification.key as keyof UserPreferences] as boolean}
                  onChange={(e) =>
                    setPreferences({ ...preferences, [notification.key]: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-valle-silver-400 text-valle-blue-600 focus:ring-valle-blue-500"
                />
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-valle-blue-600" />
            Preferências de Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-valle-navy-700 mb-2 block">
              Frequência de Resumos por Email
            </label>
            <select
              value={preferences.email_frequency}
              onChange={(e) => setPreferences({ ...preferences, email_frequency: e.target.value as any })}
              className="w-full px-3 py-2 border-2 border-valle-silver-300 rounded-lg focus:border-valle-blue-500 focus:outline-none"
            >
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
              <option value="never">Nunca</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
        <Button variant="outline" onClick={loadPreferences} className="flex-1">
          Restaurar Padrões
        </Button>
      </div>

      <Card className="border-2 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-valle-navy-800 mb-1">Encerrar Sessão</h4>
              <p className="text-sm text-valle-silver-600">Sair da sua conta Valle 360</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
