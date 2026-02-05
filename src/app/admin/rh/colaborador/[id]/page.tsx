'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminRhColaboradorDetailPage({ params }: { params: { id: string } }) {
  const id = useMemo(() => String(params?.id || ''), [params?.id]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Colaborador</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Perfil detalhado (sem mock). ID: <code>{id}</code>
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <EmptyState
            type="users"
            title="Detalhe do colaborador"
            description="Este detalhe foi limpo para remover dados simulados. Para acompanhar trabalho real, use Kanban, Mensagens e Auditoria."
            animated={false}
            action={{ label: 'Abrir Kanban', onClick: () => (window.location.href = '/admin/kanban-app') }}
            secondaryAction={{ label: 'Voltar para Colaboradores', onClick: () => (window.location.href = '/admin/colaboradores') }}
          />

          <div className="mt-4">
            <Link href="/admin/colaboradores" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Ir para Colaboradores
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


