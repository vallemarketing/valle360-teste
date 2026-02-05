'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Camera, FileText, Shield, CreditCard, Gift, Settings, Eye } from 'lucide-react';
import ClientInformationTab from './ClientInformationTab';
import ProfilePhotoTab from './ProfilePhotoTab';
import ContractTab from './ContractTab';
import RulesTab from './RulesTab';
import CreditsTab from './CreditsTab';
import BenefitsTab from './BenefitsTab';
import ThemeTab from './ThemeTab';
import AccessibilityTab from './AccessibilityTab';

type TabId = 'info' | 'photo' | 'contract' | 'rules' | 'credits' | 'benefits' | 'theme' | 'accessibility';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'info' as TabId, label: 'Informações', icon: User },
    { id: 'photo' as TabId, label: 'Foto de Perfil', icon: Camera },
    { id: 'contract' as TabId, label: 'Contrato', icon: FileText },
    { id: 'rules' as TabId, label: 'Regras', icon: Shield },
    { id: 'credits' as TabId, label: 'Créditos', icon: CreditCard },
    { id: 'benefits' as TabId, label: 'Benefícios', icon: Gift },
    { id: 'theme' as TabId, label: 'Tema', icon: Settings },
    { id: 'accessibility' as TabId, label: 'Acessibilidade', icon: Eye }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-valle-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-valle-silver-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Erro ao carregar perfil</p>
          <p className="text-valle-silver-600">Por favor, faça login novamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-valle-navy-900">Meu Perfil</h1>
        <p className="text-valle-silver-600 mt-2">Gerencie suas informações, documentos e preferências</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white shadow-lg scale-105'
                  : 'bg-white text-valle-silver-700 border-2 border-valle-silver-200 hover:border-valle-blue-300 hover:scale-102'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'info' && <ClientInformationTab userId={userId} />}
        {activeTab === 'photo' && <ProfilePhotoTab userId={userId} />}
        {activeTab === 'contract' && <ContractTab userId={userId} />}
        {activeTab === 'rules' && <RulesTab userId={userId} />}
        {activeTab === 'credits' && <CreditsTab userId={userId} />}
        {activeTab === 'benefits' && <BenefitsTab userId={userId} />}
        {activeTab === 'theme' && <ThemeTab userId={userId} />}
        {activeTab === 'accessibility' && <AccessibilityTab userId={userId} />}
      </div>
    </div>
  );
}
