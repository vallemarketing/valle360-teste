'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardRole } from '@/types/dashboard';
import { getUserRoles, getDefaultRole, getPreferredRole } from '@/config/roles';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { supabase } from '@/lib/supabase';
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
} from './views';

// Skeleton loader
function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentRole, setCurrentRole] = useState<DashboardRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<DashboardRole[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (availableRoles.length > 0) {
      determineCurrentRole();
    }
  }, [searchParams, availableRoles]);

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      setUserProfile(profile);

      // Obter roles disponíveis baseado no perfil
      const roles = getUserRoles(profile);
      setAvailableRoles(roles);

      if (roles.length === 0) {
        // Usuário sem roles definidas
        router.push('/unauthorized');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function determineCurrentRole() {
    // Prioridade: URL > localStorage > padrão
    const roleFromUrl = searchParams.get('role') as DashboardRole | null;

    if (roleFromUrl && availableRoles.includes(roleFromUrl)) {
      setCurrentRole(roleFromUrl);
      return;
    }

    const preferredRole = getPreferredRole();
    if (preferredRole && availableRoles.includes(preferredRole)) {
      setCurrentRole(preferredRole);
      // Atualizar URL
      const params = new URLSearchParams(searchParams);
      params.set('role', preferredRole);
      router.replace(`/dashboard?${params.toString()}`);
      return;
    }

    // Usar role padrão
    const defaultRole = getDefaultRole(availableRoles);
    setCurrentRole(defaultRole);
    const params = new URLSearchParams(searchParams);
    params.set('role', defaultRole);
    router.replace(`/dashboard?${params.toString()}`);
  }

  if (isLoading || !currentRole) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-16 bg-white dark:bg-gray-900 border-b animate-pulse" />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader
        currentRole={currentRole}
        availableRoles={availableRoles}
        userName={userProfile?.full_name}
        userAvatar={userProfile?.avatar_url}
      />

      <main className="container mx-auto p-6">
        {/* Renderizar view específica da role */}
        <RoleView role={currentRole} />
      </main>
    </div>
  );
}

function RoleView({ role }: { role: DashboardRole }) {
  const views: Record<DashboardRole, React.ReactNode> = {
    social: <SocialMediaView />,
    video: <VideomakerView />,
    design: <DesignView />,
    web: <WebDesignView />,
    sales: <SalesView />,
    finance: <FinanceView />,
    hr: <HRView />,
    head_marketing: <HeadMarketingView />,
    admin: <AdminView />,
  };

  return views[role] || <DefaultView role={role} />;
}

function DefaultView({ role }: { role: DashboardRole }) {
  return (
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Dashboard {role.toUpperCase()}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        View em desenvolvimento
      </p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
