'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ClienteFranqueadosPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <EmptyState
            type="users"
            title="Franqueados"
            description="Removemos dados simulados. Este módulo depende de integração real com a base de franqueados e contratos."
            animated={false}
            action={{
              label: 'Voltar ao Dashboard',
              onClick: () => {
                window.location.href = '/cliente/dashboard';
              },
            }}
            secondaryAction={{
              label: 'Falar com Suporte',
              onClick: () => {
                window.location.href = '/cliente/mensagens';
              },
            }}
          />

          <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Se este módulo é prioritário para o cliente, me diga e eu conecto o fluxo a dados reais e ao Kanban.
          </div>

          <div className="mt-4">
            <Link href="/cliente/dashboard" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Ir para o Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



