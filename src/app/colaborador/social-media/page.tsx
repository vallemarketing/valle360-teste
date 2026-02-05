'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SocialMediaPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="projects"
          title="Social Media"
          description="Removemos o modo de demonstração (mocks). Para acompanhar demandas e aprovações, use o Kanban. Para agendar/publicar, use o centro de upload."
          animated={false}
          action={{
            label: 'Abrir Kanban',
            onClick: () => {
              window.location.href = '/colaborador/kanban';
            },
          }}
          secondaryAction={{
            label: 'Agendar Postagem',
            onClick: () => {
              window.location.href = '/colaborador/social-media/upload';
            },
          }}
        />

        <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Se quiser, eu conecto este painel a métricas reais (`social_account_metrics_daily`) e posts (`instagram_posts`) — já temos cron e tabelas prontas.
        </div>

        <div className="mt-4 flex gap-4">
          <Link href="/colaborador/social-media/upload" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Agendamento
          </Link>
          <Link href="/colaborador/desempenho" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ver Desempenho
          </Link>
        </div>
      </div>
    </div>
  );
}



