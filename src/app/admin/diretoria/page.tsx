'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DiretoriaVirtualPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Diretoria Virtual</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sem mocks: KPIs só com dados reais. A Diretoria Virtual agora suporta 7 executivos (incluindo CEO/COO/CCO) em modo consultivo.
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <EmptyState
            type="default"
            title="Diretoria baseada em dados reais"
            description="Para manter 100% de confiança, a Diretoria Virtual não exibe KPIs fake. Conecte as fontes (financeiro/contratos/health score/analytics) e eu habilito os painéis com dados reais. Enquanto isso, use o chat executivo para análise e próximos passos."
            animated={false}
            action={{ label: 'Abrir CFO', onClick: () => (window.location.href = '/admin/diretoria/cfo') }}
            secondaryAction={{ label: 'Abrir Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { href: '/admin/diretoria/ceo', label: 'CEO' },
              { href: '/admin/diretoria/cfo', label: 'CFO' },
              { href: '/admin/diretoria/cto', label: 'CTO' },
              { href: '/admin/diretoria/cmo', label: 'CMO' },
              { href: '/admin/diretoria/chro', label: 'CHRO' },
              { href: '/admin/diretoria/coo', label: 'COO' },
              { href: '/admin/diretoria/cco', label: 'CCO' },
              { href: '/admin/diretoria/historico', label: 'Histórico & Decisões' },
              { href: '/admin/diretoria/memoria', label: 'Memória & Conhecimento' },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-xl border px-4 py-3 text-sm hover:opacity-90"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              >
                {x.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


