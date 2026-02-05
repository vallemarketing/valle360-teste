'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function TrafegoPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="projects"
          title="Tráfego Pago"
          description="Removemos dados simulados. O acompanhamento operacional fica no Kanban e os relatórios devem vir de integrações reais (Ads/Analytics)."
          animated={false}
          action={{
            label: 'Abrir Kanban',
            onClick: () => {
              window.location.href = '/colaborador/kanban';
            },
          }}
          secondaryAction={{
            label: 'Abrir Desempenho',
            onClick: () => {
              window.location.href = '/colaborador/desempenho';
            },
          }}
        />

        <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Próximo passo: integrar Ads/ROI (Meta/Google) para alimentar dashboards sem mock.
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



