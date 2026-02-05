'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ColaboradorRHPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="users"
          title="RH"
          description="Removemos dados simulados. Para solicitações (férias, reembolso, etc.), use a área de Solicitações. Para acompanhamento interno e aprovações, use o Kanban de RH."
          animated={false}
          action={{
            label: 'Minhas Solicitações',
            onClick: () => {
              window.location.href = '/colaborador/solicitacoes';
            },
          }}
          secondaryAction={{
            label: 'Abrir Kanban',
            onClick: () => {
              window.location.href = '/colaborador/kanban';
            },
          }}
        />

        <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          O fluxo real de solicitações já está integrado em <code>/api/requests</code> (gera tarefa no Kanban de RH sem mock).
        </div>

        <div className="mt-4 flex gap-4">
          <Link href="/colaborador/solicitacoes" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Solicitações
          </Link>
          <Link href="/colaborador/kanban" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Kanban
          </Link>
        </div>
      </div>
    </div>
  );
}



