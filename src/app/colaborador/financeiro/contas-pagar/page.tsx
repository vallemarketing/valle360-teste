'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ContasPagarPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="default"
          title="Contas a Pagar"
          description="Removemos dados simulados. Este painel será habilitado quando houver dados reais de despesas/fornecedores/recorrências."
          animated={false}
          action={{ label: 'Abrir Financeiro (Admin)', onClick: () => (window.location.href = '/admin/financeiro') }}
          secondaryAction={{ label: 'Abrir Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
        />

        <div className="mt-4 flex items-center gap-2">
          <Receipt className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <Link href="/admin/financeiro" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Financeiro
          </Link>
        </div>
      </div>
    </div>
  );
}


