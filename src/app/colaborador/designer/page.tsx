'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DesignerPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="projects"
          title="Painel Designer"
          description="Para garantir dados reais (sem mocks), este painel foi consolidado no Kanban por área. Use o Kanban para acompanhar demandas, comentários e aprovações."
          animated={false}
          action={{
            label: 'Abrir Kanban',
            onClick: () => {
              window.location.href = '/colaborador/kanban';
            },
          }}
          secondaryAction={{
            label: 'Abrir Aprovações',
            onClick: () => {
              window.location.href = '/colaborador/aprovacoes';
            },
          }}
        />

        <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Se você quiser, eu conecto este painel diretamente ao board de <strong>Designer Gráfico</strong> (tarefas, anexos e versões) usando o Kanban existente.
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



