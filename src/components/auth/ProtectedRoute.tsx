'use client';

/**
 * ProtectedRoute - Componente de proteção de rotas
 * 
 * MODO TESTE ATIVO: Permite acesso sem verificação de roles
 * Em produção, o modo teste é sempre desabilitado.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, type UserRole } from '@/lib/auth';
import { Button } from '@/components/ui/button';

// =========================================
// MODO TESTE: Permite acesso sem verificação
// Controlado por env e sempre OFF em produção
// =========================================
const TEST_MODE =
  process.env.NODE_ENV !== 'production' &&
  String(process.env.NEXT_PUBLIC_TEST_MODE || '').toLowerCase() === 'true';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(TEST_MODE); // Em teste, já começa autorizado
  const [isLoading, setIsLoading] = useState(!TEST_MODE); // Em teste, não mostra loading

  // Em modo teste, permite acesso imediato
  if (TEST_MODE) {
    return <>{children}</>;
  }

  // =========================================
  // Código de produção abaixo (só executa quando TEST_MODE = false)
  // =========================================

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.push(redirectTo);
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        router.push('/login');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth error:', error);
      router.push(redirectTo);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedRoles, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Voltar para Login
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
