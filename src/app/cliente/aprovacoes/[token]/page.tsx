'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ClientApprovalPage({ params }: { params: { token: string } }) {
  const token = useMemo(() => String(params?.token || ''), [params?.token])

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="w-full max-w-lg rounded-2xl border p-8" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
        <EmptyState
          type="default"
          title="Link de aprovação por token"
          description={`Este modo de aprovação via link/token ainda não está habilitado neste ambiente.\n\nToken: ${token.slice(0, 8)}…`}
          animated={false}
          action={{
            label: 'Abrir Aprovações',
            onClick: () => {
              window.location.href = '/cliente/aprovacoes'
            },
          }}
          secondaryAction={{
            label: 'Voltar ao Painel',
            onClick: () => {
              window.location.href = '/cliente/dashboard'
            },
          }}
        />

        <div className="mt-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Se você precisa que o link externo de aprovação funcione (sem login), me diga e eu habilito com token real + validação e anexos.
        </div>
      </div>
    </div>
  )
}

