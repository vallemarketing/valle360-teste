'use client';

import { useEffect, useState } from 'react';
import { DashboardRole } from '@/types/dashboard';
import { getUserRoles, getDefaultRole, getPreferredRole, savePreferredRole, ROLES_CONFIG } from '@/config/roles';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>
  );
}

export default function DashboardMultiPage() {
  const [currentRole, setCurrentRole] = useState<DashboardRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<DashboardRole[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      setUserProfile(profile);

      // Obter roles disponíveis
      const roles = getUserRoles(profile);
      setAvailableRoles(roles);

      if (roles.length === 0) {
        // Se não tiver roles, dar acesso básico ao social
        setAvailableRoles(['social']);
        setCurrentRole('social');
      } else {
        // Verificar role preferida
        const preferredRole = getPreferredRole();
        if (preferredRole && roles.includes(preferredRole)) {
          setCurrentRole(preferredRole);
        } else {
          const defaultRole = getDefaultRole(roles);
          setCurrentRole(defaultRole);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Em caso de erro, dar acesso básico
      setAvailableRoles(['social']);
      setCurrentRole('social');
    } finally {
      setIsLoading(false);
    }
  }

  function handleRoleChange(newRole: string) {
    const role = newRole as DashboardRole;
    setCurrentRole(role);
    savePreferredRole(role);
  }

  if (isLoading || !currentRole) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const currentRoleConfig = ROLES_CONFIG[currentRole];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Simplificado */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Dashboard Corporativo
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userProfile?.full_name || 'Usuário'}
                </p>
              </div>
            </div>

            <Select value={currentRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentRoleConfig.color }}
                    />
                    <span>{currentRoleConfig.label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => {
                  const config = ROLES_CONFIG[role];
                  return (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Conteúdo do Dashboard */}
      <main className="container mx-auto p-6">
        {currentRole === 'social' && <SocialMediaView />}
        {currentRole === 'video' && <VideomakerView />}
        {currentRole === 'design' && <DesignView />}
        {currentRole === 'web' && <WebDesignView />}
        {currentRole === 'sales' && <SalesView />}
        {currentRole === 'finance' && <FinanceView />}
        {currentRole === 'hr' && <HRView />}
        {currentRole === 'head_marketing' && <HeadMarketingView />}
        {currentRole === 'admin' && <AdminView />}
      </main>
    </div>
  );
}
