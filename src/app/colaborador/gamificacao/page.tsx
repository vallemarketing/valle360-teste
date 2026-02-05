'use client';

import Link from 'next/link';
import { Award } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function GamificacaoPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="default"
          title="Gamificação"
          description="Removemos ranking e conquistas simulados. Este módulo será habilitado quando estiver alimentado por dados reais (pontos, recompensas, badges)."
          animated={false}
          action={{ label: 'Voltar ao Dashboard', onClick: () => (window.location.href = '/colaborador/dashboard') }}
          secondaryAction={{ label: 'Ver Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
        />

        <div className="mt-4 flex items-center gap-2">
          <Award className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <Link href="/colaborador/dashboard" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


