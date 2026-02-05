'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { ExecutiveChatModal } from '@/components/csuite/ExecutiveChatModal';
import { InsightsPanel } from '@/components/csuite/InsightsPanel';
import { GenerateInsightsButton } from '@/components/csuite/GenerateInsightsButton';

export default function COOPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">COO (Operações & Entrega)</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Consultiva e baseada em dados reais (Kanban, eventos e sinais preditivos). CTAs viram rascunhos com confirmação.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExecutiveChatModal role="coo" execName="Fernanda" title="Conversar com COO" subtitle="Execução, prazos, capacidade e qualidade (consultiva)." />
          <GenerateInsightsButton role="coo" label="Gerar insights da COO" />
          <Link href="/admin/diretoria" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Voltar
          </Link>
        </div>

        <InsightsPanel role="coo" />
      </div>
    </div>
  );
}

