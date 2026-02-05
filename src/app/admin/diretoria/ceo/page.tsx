'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';
import { ExecutiveChatModal } from '@/components/csuite/ExecutiveChatModal';
import { InsightsPanel } from '@/components/csuite/InsightsPanel';
import { GenerateInsightsButton } from '@/components/csuite/GenerateInsightsButton';

export default function CEOPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">CEO (Estratégia)</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Consultiva e baseada em dados reais (sem mocks). Síntese entre áreas + decisões com CTAs (com sua confirmação).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExecutiveChatModal role="ceo" execName="Helena" title="Conversar com CEO" subtitle="Mediação e decisão estratégica (consultiva)." />
          <GenerateInsightsButton role="ceo" label="Gerar insights do CEO" />
          <Link href="/admin/diretoria" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Voltar
          </Link>
        </div>

        <InsightsPanel role="ceo" />
      </div>
    </div>
  );
}

