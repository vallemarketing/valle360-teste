'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ColaboradorComercialPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="projects"
          title="Comercial"
          description="Removemos dados simulados. Para pipeline real, use Propostas/CRM (Admin) e o Kanban para execução."
          animated={false}
          action={{
            label: 'Abrir Kanban',
            onClick: () => {
              window.location.href = '/colaborador/kanban';
            },
          }}
          secondaryAction={{
            label: 'Abrir Propostas (Admin)',
            onClick: () => {
              window.location.href = '/admin/comercial/propostas';
            },
          }}
        />

        <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          A prospecção automática não gera mais leads falsos. Para ativar, precisamos integrar o provedor (Tavily/N8N/CRM).
        </div>

        <div className="mt-4 flex gap-4">
          <Link href="/colaborador/kanban" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Kanban
          </Link>
          <Link href="/admin/comercial/propostas" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Propostas
          </Link>
        </div>
      </div>
    </div>
  );
}



