'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function RHPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <EmptyState
          type="users"
          title="RH (legado)"
          description="Esta página antiga usava dados simulados. O RH real fica em /admin/rh e /admin/rh/inteligencia (dados reais: colaboradores, metas, solicitações e vagas)."
          animated={false}
          action={{ label: 'Abrir Gestão RH', onClick: () => (window.location.href = '/admin/rh') }}
          secondaryAction={{ label: 'RH Inteligência', onClick: () => (window.location.href = '/admin/rh/inteligencia') }}
        />

        <div className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Se você chegou aqui via link antigo, atualize seus favoritos. <ShieldCheck className="inline w-4 h-4 ml-1" />
      </div>

        <div className="mt-4 flex gap-4">
          <Link href="/admin/rh" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Gestão RH
          </Link>
          <Link href="/admin/rh/inteligencia" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ir para RH Inteligência
          </Link>
      </div>
      </div>
    </div>
  );
}



