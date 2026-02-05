'use client';

import Link from 'next/link';
import { Workflow } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminIntegracoesN8NPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Integração N8N</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Removemos workflows simulados. Aqui ficará o status real da integração e atalhos para o N8N.
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <EmptyState
            type="default"
            title="N8N ainda não configurado"
            description="Para ativar a listagem real de workflows/executions, conecte o N8N na tela de Integrações (credenciais/URL)."
            animated={false}
            action={{ label: 'Abrir Integrações', onClick: () => (window.location.href = '/admin/integracoes') }}
            secondaryAction={{ label: 'Abrir Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
          />

          <div className="mt-4">
            <Link href="/admin/integracoes" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Ir para Integrações
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


