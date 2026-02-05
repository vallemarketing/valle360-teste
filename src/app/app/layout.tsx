'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['colaborador', 'super_admin']}>
      <div className="flex min-h-screen bg-white dark:bg-[#0a0f1a]">
        <Sidebar />
        <main className="flex-1">
          <div className="sticky top-0 z-30 h-16 border-b border-[#001533]/10 dark:border-white/10 bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur px-6 flex items-center">
            <h2 className="text-lg font-semibold text-[#001533] dark:text-white">Área Interna</h2>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
