'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { DirectorChatModal } from '@/components/diretoria/DirectorChatModal';
import { ExecutiveChatModal } from '@/components/csuite/ExecutiveChatModal';
import { InsightsPanel } from '@/components/csuite/InsightsPanel';
import { GenerateInsightsButton } from '@/components/csuite/GenerateInsightsButton';

export default function CTOPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">CTO (Operações)</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sem mocks: métricas de capacidade/eficiência só com dados reais do Kanban + auditoria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DirectorChatModal
            director="cto"
            title="Conversar com CTO"
            subtitle="Chat executivo focado em operação (SLA, WIP, gargalos)."
          />
          <ExecutiveChatModal
            role="cto"
            execName="André"
            title="Chat C‑Suite (CTO)"
            subtitle="Novo chat consultivo + insights + CTAs (rascunho/confirmar)."
            buttonClassName="bg-white text-[#001533] border hover:bg-gray-50"
          />
          <GenerateInsightsButton role="cto" label="Gerar insights do CTO" />
          <Link href="/admin/diretoria" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Voltar
          </Link>
        </div>

        <InsightsPanel role="cto" />

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <EmptyState
            type="default"
            title="Operações com dados reais"
            description="Removemos indicadores simulados. Para habilitar o CTO, conectamos o painel às métricas reais do Kanban (SLA, WIP, atrasos) e às execuções de cron (logs)."
            animated={false}
            action={{ label: 'Abrir Kanban', onClick: () => (window.location.href = '/admin/kanban-app') }}
            secondaryAction={{ label: 'Ver Logs (Cron)', onClick: () => (window.location.href = '/admin/prontidao') }}
          />

          <div className="mt-4">
            <Link href="/admin/kanban-app" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Ir para Kanban
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


