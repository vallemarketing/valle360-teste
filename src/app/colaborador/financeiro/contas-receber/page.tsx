'use client';

import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ContasReceberPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="default"
          title="Contas a Receber"
          description="Removemos dados simulados. Este módulo será habilitado quando o pipeline financeiro estiver conectado (contratos, cobranças, pagamentos)."
          animated={false}
          action={{ label: 'Abrir Financeiro (Admin)', onClick: () => (window.location.href = '/admin/financeiro') }}
          secondaryAction={{ label: 'Abrir Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
        />

        <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          O cron de cobrança (<code>/api/cron/collection</code>) já existe; falta conectar a origem de contratos/pagamentos para alimentar este painel sem mock.
        </div>

        <div className="mt-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <Link href="/admin/financeiro" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Financeiro
          </Link>
        </div>
      </div>
    </div>
  );
}


