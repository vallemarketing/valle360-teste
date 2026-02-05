'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ROLES_CONFIG } from '@/config/roles';
import {
  SocialMediaView,
  SalesView,
  HeadMarketingView,
  VideomakerView,
  DesignView,
  WebDesignView,
  FinanceView,
  HRView,
  AdminView,
} from '@/app/dashboard/views';

export default function TrafegoPage() {
  const [selectedDashboard, setSelectedDashboard] = useState<string>('head_marketing');

  const dashboards = [
    { id: 'head_marketing', name: 'Head de Marketing', color: '#9370DB' },
    { id: 'admin', name: 'Administrador', color: '#1E90FF' },
    { id: 'sales', name: 'Comercial', color: '#32CD32' },
    { id: 'social', name: 'Social Media', color: '#E1306C' },
    { id: 'video', name: 'Videomaker', color: '#FF0000' },
    { id: 'design', name: 'Designer Gráfico', color: '#7B68EE' },
    { id: 'web', name: 'Web Designer', color: '#4169E1' },
    { id: 'finance', name: 'Financeiro', color: '#FFD700' },
    { id: 'hr', name: 'RH', color: '#FF6347' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header com Título e Botões */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Gestão de Tráfego Pago
          </h1>

          {/* Grid de Botões de Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {dashboards.map((dashboard) => (
              <Button
                key={dashboard.id}
                onClick={() => setSelectedDashboard(dashboard.id)}
                className={`h-auto py-4 flex flex-col items-center gap-2 transition-all ${
                  selectedDashboard === dashboard.id
                    ? 'ring-4 ring-offset-2 scale-105 shadow-xl'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: selectedDashboard === dashboard.id ? dashboard.color : '#ffffff',
                  color: selectedDashboard === dashboard.id ? '#ffffff' : dashboard.color,
                  borderColor: dashboard.color,
                  borderWidth: '2px',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: dashboard.color }}
                />
                <span className="font-semibold text-sm text-center">
                  {dashboard.name}
                </span>
              </Button>
            ))}
          </div>

          {/* Indicador do Dashboard Selecionado */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-pink-50 dark:from-amber-900/20 dark:to-pink-900/20 rounded-lg border-2 border-amber-300 dark:border-primary">
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full shadow-lg"
                style={{
                  backgroundColor: dashboards.find(d => d.id === selectedDashboard)?.color
                }}
              />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visualizando Dashboard:</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {dashboards.find(d => d.id === selectedDashboard)?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo do Dashboard Selecionado */}
      <main className="container mx-auto p-6">
        {selectedDashboard === 'social' && <SocialMediaView />}
        {selectedDashboard === 'video' && <VideomakerView />}
        {selectedDashboard === 'design' && <DesignView />}
        {selectedDashboard === 'web' && <WebDesignView />}
        {selectedDashboard === 'sales' && <SalesView />}
        {selectedDashboard === 'finance' && <FinanceView />}
        {selectedDashboard === 'hr' && <HRView />}
        {selectedDashboard === 'head_marketing' && <HeadMarketingView />}
        {selectedDashboard === 'admin' && <AdminView />}
      </main>
    </div>
  );
}
