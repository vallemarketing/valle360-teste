'use client';

import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { DirectorChatModal } from '@/components/diretoria/DirectorChatModal';
import { ExecutiveChatModal } from '@/components/csuite/ExecutiveChatModal';
import { InsightsPanel } from '@/components/csuite/InsightsPanel';
import { GenerateInsightsButton } from '@/components/csuite/GenerateInsightsButton';

export default function CFOPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">CFO (Financeiro)</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sem mocks: este painel só será habilitado com dados reais (contratos, cobranças, pagamentos, Stripe).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DirectorChatModal
            director="cfo"
            title="Conversar com CFO"
            subtitle="Chat executivo com base em dados reais do sistema (best-effort)."
          />
          <ExecutiveChatModal
            role="cfo"
            execName="Eduardo"
            title="Chat C‑Suite (Eduardo)"
            subtitle="Novo chat consultivo + insights + CTAs (rascunho/confirmar)."
            buttonClassName="bg-white text-[#001533] border hover:bg-gray-50"
          />
          <GenerateInsightsButton role="cfo" label="Gerar insights do CFO" />
          <Link href="/admin/diretoria" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Voltar
          </Link>
        </div>

        <InsightsPanel role="cfo" />

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <EmptyState
            type="default"
            title="Financeiro real (em ativação)"
            description="Para manter confiabilidade, removemos KPIs simulados. Conecte Stripe/contratos e a coleta automática (cron) e eu habilito receita, MRR, inadimplência e alertas reais."
            animated={false}
            action={{ label: 'Abrir Financeiro', onClick: () => (window.location.href = '/admin/financeiro') }}
            secondaryAction={{ label: 'Abrir Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
          />

          <div className="mt-4">
            <Link href="/admin/financeiro" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Ir para Financeiro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


