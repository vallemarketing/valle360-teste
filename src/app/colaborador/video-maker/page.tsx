'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function VideoMakerPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="projects"
          title="Vídeo Maker"
          description="Removemos dados simulados. Acompanhe suas demandas e prazos no Kanban e use o fluxo de aprovações para validação com o cliente."
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
          Próximo passo: integrar anexos/versões e preview de mídia (sem mock) diretamente nas tarefas.
        </div>

        <div className="mt-4">
          <Link href="/colaborador/aprovacoes" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Aprovações
          </Link>
        </div>
      </div>
    </div>
  );
}



