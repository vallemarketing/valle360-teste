'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AREA_BOARDS, type AreaKey } from '@/lib/kanban/areaBoards';

export default function VincularColaboradorPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<AreaKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const areasList = useMemo(() => AREA_BOARDS.map((b) => ({ key: b.areaKey, label: b.label })), []);

  function toggleArea(key: AreaKey) {
    setSelectedAreas((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/link-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName: fullName || undefined,
          phone: phone || undefined,
          areas: selectedAreas,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao vincular');
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Vincular colaborador existente
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Use quando o usuário já existe no Supabase (login/senha). Isso NÃO cria usuário novo no Auth.
            </p>
          </div>
          <Link className="text-sm underline" href="/admin/colaboradores">
            Voltar
          </Link>
        </div>

        <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Email (login existente)
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@dominio.com"
                className="mt-1 w-full px-3 py-2 rounded-lg border"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Nome completo (opcional)
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Ana Silva"
                  className="mt-1 w-full px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Telefone/WhatsApp (opcional)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +55 11 99999-9999"
                  className="mt-1 w-full px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Áreas (define quais boards o colaborador acessa)
              </label>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Dica: para Financeiro selecione “Contas a Pagar” e/ou “Contas a Receber” (não use “Financeiro” genérico).
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {areasList.map((a) => (
                  <label
                    key={a.key}
                    className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    <input type="checkbox" checked={selectedAreas.includes(a.key)} onChange={() => toggleArea(a.key)} />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {a.label}
                    </span>
                    <span className="ml-auto text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {a.key}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--error-200)', backgroundColor: 'var(--error-50)' }}>
                <p className="text-sm" style={{ color: 'var(--error-700)' }}>
                  {error}
                </p>
              </div>
            )}

            {result && (
              <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--success-200)', backgroundColor: 'var(--success-50)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--success-700)' }}>
                  Vinculado com sucesso
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  userId: {result.userId} • áreas: {(result.areas || []).join(', ')}
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Próximo passo: logar com esse usuário e abrir <code>/colaborador/kanban</code>.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || selectedAreas.length === 0}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Vinculando…' : 'Vincular'}
              </button>
              <Link className="text-sm underline" href="/admin/colaboradores/novo">
                Criar novo colaborador (gera usuário no Auth)
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


