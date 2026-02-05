'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WebDesignerPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="projects"
          title="Web Designer"
          description="Removemos dados simulados. Use o Kanban para acompanhar demandas, briefing, produção e entrega de peças web (landing pages, sites, layouts)."
          animated={false}
          action={{
            label: 'Abrir Kanban',
            onClick: () => {
              window.location.href = '/colaborador/kanban';
            },
          }}
          secondaryAction={{
            label: 'Arquivos',
            onClick: () => {
              window.location.href = '/colaborador/arquivos';
            },
          }}
        />

        <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Próximo passo: integrar templates e histórico de versões via anexos do Supabase Storage (sem mock).
        </div>

        <div className="mt-4">
          <Link href="/colaborador/kanban" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Kanban agora
          </Link>
        </div>
      </div>
    </div>
  );
}



