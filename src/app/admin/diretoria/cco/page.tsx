'use client';

import Link from 'next/link';
import { Handshake } from 'lucide-react';
import { ExecutiveChatModal } from '@/components/csuite/ExecutiveChatModal';
import { InsightsPanel } from '@/components/csuite/InsightsPanel';
import { GenerateInsightsButton } from '@/components/csuite/GenerateInsightsButton';

export default function CCOPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Handshake className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">CCO (Clientes & Retenção)</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Consultiva e baseada em dados reais (health/churn/pagamentos quando disponíveis). CTAs com confirmação humana.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExecutiveChatModal role="cco" execName="Juliana" title="Conversar com CCO" subtitle="Saúde do cliente, churn e expansão (consultiva)." />
          <GenerateInsightsButton role="cco" label="Gerar insights da CCO" />
          <Link href="/admin/diretoria" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Voltar
          </Link>
        </div>

        <InsightsPanel role="cco" />
      </div>
    </div>
  );
}

