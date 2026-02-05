'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminIntegracoesApiPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Central de APIs</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Removemos chaves/logs simulados. Esta área deve refletir apenas dados reais e logs reais.
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <EmptyState
            type="default"
            title="APIs (sem mock)"
            description="Para expor API keys e logs reais, precisamos ligar este módulo às tabelas de API keys/logs (e políticas RLS)."
            animated={false}
            action={{ label: 'Abrir Docs', onClick: () => (window.location.href = '/admin/integracoes/api/docs') }}
            secondaryAction={{ label: 'Abrir Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
          />

          <div className="mt-4">
            <Link href="/admin/integracoes/api/docs" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Ir para Docs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


