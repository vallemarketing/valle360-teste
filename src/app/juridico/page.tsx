'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function JuridicoPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <EmptyState
            type="documents"
            title="Jurídico"
            description="Removemos dados simulados. Para acompanhar demandas jurídicas e contratos, use o Kanban e a área de Contratos."
            animated={false}
            action={{
              label: 'Abrir Kanban',
              onClick: () => {
                window.location.href = '/colaborador/kanban';
              },
            }}
            secondaryAction={{
              label: 'Ver Contratos (Admin)',
              onClick: () => {
                window.location.href = '/admin/contratos';
              },
            }}
          />

          <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Se você quiser o módulo Jurídico completo (contratos, casos e documentos) com dados reais, eu conecto às tabelas existentes de contratos e ao Kanban de <strong>Jurídico</strong>.
          </div>

          <div className="mt-4">
            <Link href="/admin/contratos" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Ir para Contratos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



