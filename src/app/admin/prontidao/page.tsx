'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type ReadinessStatus = 'pass' | 'warn' | 'fail';
type UiStatus = ReadinessStatus | 'na';

function pill(status: UiStatus) {
  if (status === 'pass') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'warn') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (status === 'fail') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function label(status: UiStatus) {
  if (status === 'pass') return 'OK';
  if (status === 'warn') return 'Atenção';
  if (status === 'fail') return 'Falha';
  return 'N/A';
}

function effectiveStatus(status: ReadinessStatus, applicable?: boolean): UiStatus {
  if (applicable === false) return 'na';
  return status;
}

function normalizeIntegrationCheck(v: any): { status: ReadinessStatus; applicable?: boolean } {
  if (!v) return { status: 'warn', applicable: true };
  if (typeof v === 'string') return { status: v as ReadinessStatus, applicable: true };
  if (typeof v === 'object' && typeof v.status === 'string') {
    return { status: v.status as ReadinessStatus, applicable: v.applicable };
  }
  return { status: 'warn', applicable: true };
}

export default function ProntidaoPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronRunResult, setCronRunResult] = useState<any[] | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || null;

      const res = await fetch('/api/admin/readiness', {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao carregar prontidão');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  async function runCronNow() {
    setCronRunning(true);
    setCronRunResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || null;

      const jobs = [
        { job: 'collection', url: '/api/cron/collection' },
        { job: 'overdue', url: '/api/cron/overdue' },
        { job: 'ml', url: '/api/cron/ml' },
        { job: 'alerts', url: '/api/cron/alerts' },
        { job: 'csuite-insights', url: '/api/cron/csuite-insights' },
        { job: 'social-publish', url: '/api/cron/social-publish' },
        { job: 'social-metrics', url: '/api/cron/social-metrics' },
      ];

      const results = await Promise.all(
        jobs.map(async (j) => {
          try {
            const res = await fetch(j.url, {
              method: 'POST',
              cache: 'no-store',
              credentials: 'same-origin',
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            });
            const json = await res.json().catch(() => null);
            return {
              job: j.job,
              ok: res.ok && (json?.success !== false),
              status: res.status,
              message: json?.message || json?.result?.message || null,
              error: res.ok ? null : (json?.error || 'Falha'),
            };
          } catch (e: any) {
            return { job: j.job, ok: false, status: 0, message: null, error: e?.message || 'Erro de rede' };
          }
        })
      );

      setCronRunResult(results);
      await load();
    } finally {
      setCronRunning(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const overall: ReadinessStatus | null = useMemo(() => data?.overall ?? null, [data]);
  const checks = data?.checks;
  const firebase = data?.firebase;
  const env = data?.environment;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Prontidão do Sistema
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Checklist operacional: áreas, Hub, integrações, IA, ML e SQL.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {overall && (
              <span className={`px-3 py-1 rounded-full border text-sm font-medium ${pill(overall)}`}>
                {label(overall)}
              </span>
            )}
            <button
              onClick={load}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              Recarregar
            </button>
          </div>
        </div>

        {env?.vercelEnv && (
          <div className="p-4 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
            Ambiente: <span style={{ color: 'var(--text-primary)' }}>{String(env.vercelEnv)}</span>
            {env?.appUrl ? (
              <>
                {' '}
                • URL: <span style={{ color: 'var(--text-primary)' }}>{String(env.appUrl)}</span>
              </>
            ) : null}
          </div>
        )}

        {loading && (
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Carregando…</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <p className="font-medium text-red-700">Erro</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Firebase (Opcional) */}
            <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Firebase (opcional)</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(firebase?.status || 'warn', firebase?.applicable))}`}>
                  {label(effectiveStatus(firebase?.status || 'warn', firebase?.applicable))}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {firebase?.applicable === false
                  ? 'Não aplicável (uploads usam Supabase Storage por padrão).'
                  : firebase?.status === 'pass'
                  ? 'Env vars do Firebase estão configuradas.'
                  : 'Configure as env vars NEXT_PUBLIC_FIREBASE_* para habilitar upload direto.'}
              </p>
            </div>

            {/* Hub */}
            <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Hub (Eventos/Transições)</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.hub.status, checks.hub.applicable))}`}>
                  {label(effectiveStatus(checks.hub.status, checks.hub.applicable))}
                </span>
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center justify-between"><span>Eventos pendentes</span><span className="font-medium">{checks.hub.pendingEvents}</span></div>
                <div className="flex items-center justify-between"><span>Transições pendentes</span><span className="font-medium">{checks.hub.pendingTransitions}</span></div>
                <div className="flex items-center justify-between"><span>Transições em erro</span><span className="font-medium">{checks.hub.errorTransitions}</span></div>
              </div>
              <div className="mt-3">
                <Link className="text-sm underline" href="/admin/fluxos">Abrir Central de Fluxos</Link>
              </div>
            </div>

            {/* Segurança */}
            <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Segurança</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.security?.status || 'warn', checks.security?.applicable))}`}>
                  {label(effectiveStatus(checks.security?.status || 'warn', checks.security?.applicable))}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {checks.security?.notes || 'OK'}
              </p>
            </div>

            {/* Áreas */}
            <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Áreas (Colaboradores)</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.areas.status, checks.areas.applicable))}`}>
                  {label(effectiveStatus(checks.areas.status, checks.areas.applicable))}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                {checks.areas.coverage.map((a: any) => (
                  <div key={a.area} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--text-primary)' }}>{a.area}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${pill(a.status)}`}>{label(a.status)}</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>{a.activeEmployees} ativos</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Link className="text-sm underline" href="/admin/colaboradores">Gerenciar colaboradores</Link>
                <span className="mx-2 text-sm" style={{ color: 'var(--text-secondary)' }}>•</span>
                <Link className="text-sm underline" href="/admin/colaboradores/vincular">Vincular existente</Link>
              </div>
            </div>

            {/* Integrações */}
            <div className="p-5 rounded-xl border lg:col-span-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Integrações</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.integrations.status, checks.integrations.applicable))}`}>
                  {label(effectiveStatus(checks.integrations.status, checks.integrations.applicable))}
                </span>
              </div>

              {checks.integrations.required ? (
                <>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Obrigatórias</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(checks.integrations.required).map(([id, raw]: any) => {
                      const st = normalizeIntegrationCheck(raw);
                      const ui = effectiveStatus(st.status, st.applicable);
                      return (
                        <div key={id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{id}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-xs ${pill(ui)}`}>{label(ui)}</span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {ui === 'pass' ? 'Conectado' : 'Configure/Conecte nas integrações'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(checks.integrations.critical || {}).map(([id, raw]: any) => {
                    const st = normalizeIntegrationCheck(raw);
                    const ui = effectiveStatus(st.status, st.applicable);
                    return (
                      <div key={id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{id}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-xs ${pill(ui)}`}>{label(ui)}</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {ui === 'pass' ? 'Conectado' : 'Configure/Conecte nas integrações'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {checks.integrations.optional ? (
                <>
                  <p className="text-xs mt-4 mb-2" style={{ color: 'var(--text-secondary)' }}>Opcionais</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(checks.integrations.optional).map(([id, raw]: any) => {
                      const st = normalizeIntegrationCheck(raw);
                      const ui = effectiveStatus(st.status, st.applicable);
                      return (
                        <div key={id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{id}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-xs ${pill(ui)}`}>{label(ui)}</span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {ui === 'na' ? 'Opcional (não configurado)' : ui === 'pass' ? 'Conectado' : 'Configure/Conecte nas integrações'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}

              <div className="mt-4 flex items-center gap-4">
                <Link className="text-sm underline" href="/admin/integracoes">Abrir Integrações</Link>
                <Link className="text-sm underline" href="/admin/integracoes/n8n">N8N</Link>
              </div>
            </div>

            {/* IA/ML/SQL */}
            <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>IA</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.ai.status, checks.ai.applicable))}`}>
                  {label(effectiveStatus(checks.ai.status, checks.ai.applicable))}
                </span>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-primary)' }}>OpenRouter</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${pill(checks.ai.providers.openrouter)}`}>{label(checks.ai.providers.openrouter)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-primary)' }}>OpenAI</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${pill(checks.ai.providers.openai)}`}>{label(checks.ai.providers.openai)}</span>
                </div>
              </div>
              <div className="mt-3">
                <Link className="text-sm underline" href="/admin/inteligencia">Abrir Inteligência</Link>
              </div>
            </div>

            {/* Schema (Supabase) */}
            <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Schema (Supabase)</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.schema.status, checks.schema.applicable))}`}>
                  {label(effectiveStatus(checks.schema.status, checks.schema.applicable))}
                </span>
              </div>
              <div className="text-sm space-y-2">
                {(checks.schema.criticalTables || []).slice(0, 8).map((t: any) => (
                  <div key={t.table} className="flex items-center justify-between gap-3">
                    <span className="truncate" style={{ color: 'var(--text-primary)' }}>{t.table}</span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-xs ${pill(t.status)}`}>{label(t.status)}</span>
                  </div>
                ))}
                {(checks.schema.criticalTables || []).length > 8 && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    +{(checks.schema.criticalTables || []).length - 8} tabelas…
                  </p>
                )}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                Se alguma tabela crítica estiver ausente, o sistema pode retornar erro 500 em rotas específicas.
              </p>
            </div>

            <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>ML / Metas</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.ml.status, checks.ml.applicable))}`}>
                  {label(effectiveStatus(checks.ml.status, checks.ml.applicable))}
                </span>
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center justify-between"><span>Configs de metas</span><span className="font-medium">{checks.ml.goalConfigs}</span></div>
                <div className="flex items-center justify-between"><span>Modelos ML</span><span className="font-medium">{checks.ml.mlModels}</span></div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <Link className="text-sm underline" href="/admin/metas">Metas</Link>
                <Link className="text-sm underline" href="/admin/machine-learning">Machine Learning</Link>
              </div>
            </div>

            {/* Cron */}
            <div className="p-5 rounded-xl border lg:col-span-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Cron (Vercel)</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.cron.status, checks.cron.applicable))}`}>
                  {label(effectiveStatus(checks.cron.status, checks.cron.applicable))}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={runCronNow}
                  disabled={cronRunning}
                  className="px-3 py-2 rounded-lg border text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                >
                  {cronRunning ? 'Rodando…' : 'Rodar agora'}
                </button>
                {cronRunResult && (
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Executado agora • {cronRunResult.filter((r) => r.ok).length}/{cronRunResult.length} OK
                  </span>
                )}
              </div>

              {cronRunResult && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {cronRunResult.map((r) => {
                    const st: UiStatus = r.ok ? 'pass' : 'warn';
                    return (
                      <div key={r.job} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.job}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-xs ${pill(st)}`}>{label(st)}</span>
                        </div>
                        {r.error ? (
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.error}</p>
                        ) : (
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.message || 'OK'}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {checks.cron.applicable === false && checks.cron.reason && (
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {checks.cron.reason}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(checks.cron.jobs || []).map((j: any) => (
                  <div key={j.job} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{j.job}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${pill(effectiveStatus(j.status, j.applicable))}`}>
                        {label(effectiveStatus(j.status, j.applicable))}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {j.applicable === false
                        ? 'Não aplicável neste ambiente'
                        : j.lastRunAt
                          ? `Última execução: ${new Date(j.lastRunAt).toLocaleString()}`
                          : 'Sem execução nas últimas 24h'}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                Observação: para “pass”, cada job precisa ter ao menos 1 log nas últimas 24h.
              </p>
            </div>

            {/* Alertas */}
            <div className="p-5 rounded-xl border lg:col-span-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Alertas (threshold)</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.alerts?.status || 'warn', checks.alerts?.applicable))}`}>
                  {label(effectiveStatus(checks.alerts?.status || 'warn', checks.alerts?.applicable))}
                </span>
              </div>
              <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center justify-between">
                  <span>Actor (ALERTS_ACTOR_USER_ID)</span>
                  <span className="font-medium">{checks.alerts?.actorUserIdValid ? 'OK' : 'Falta/Inválido'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SendGrid (FROM)</span>
                  <span className="font-medium">{checks.alerts?.sendgridFromConfigured ? 'OK' : 'Falta'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Destinatários (Email env)</span>
                  <span className="font-medium">
                    {checks.alerts?.hasEmailRecipientsEnv ? 'OK' : checks.alerts?.fallbackAdminEmails > 0 ? `OK (db: ${checks.alerts?.fallbackAdminEmails})` : 'Nenhum'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Destinatários (WhatsApp env)</span>
                  <span className="font-medium">{checks.alerts?.hasWhatsAppRecipientsEnv ? 'OK' : 'Opcional'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Destinatários (Intranet env)</span>
                  <span className="font-medium">
                    {checks.alerts?.hasIntranetRecipientsEnv ? 'OK' : checks.alerts?.fallbackAdminUserIds > 0 ? `OK (db: ${checks.alerts?.fallbackAdminUserIds})` : 'Nenhum'}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <Link className="text-sm underline" href="/admin/analytics/preditivo">Abrir Analytics Preditivo</Link>
              </div>
            </div>

            {/* QA (smoke checks) */}
            <div className="p-5 rounded-xl border lg:col-span-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>QA (smoke checks)</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.qa?.status || 'warn', checks.qa?.applicable))}`}>
                  {label(effectiveStatus(checks.qa?.status || 'warn', checks.qa?.applicable))}
                </span>
              </div>
              <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center justify-between">
                  <span>Kanban • Boards por área</span>
                  <span className="font-medium">
                    {Array.isArray(checks.qa?.kanban?.missingAreaBoards) && checks.qa.kanban.missingAreaBoards.length > 0
                      ? `Faltando: ${checks.qa.kanban.missingAreaBoards.length}`
                      : 'OK'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Solicitações • Coluna “Demanda”</span>
                  <span className="font-medium">
                    {checks.qa?.kanban?.requestsDemandColumn?.ok ? 'OK' : 'Falta (RH/Operação)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Colaborador • Assignments (clientes)</span>
                  <span className="font-medium">
                    {checks.qa?.collaborator?.employeeClientAssignments?.status ? label(checks.qa.collaborator.employeeClientAssignments.status) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cliente • Perfil (segment/competitors)</span>
                  <span className="font-medium">
                    {checks.qa?.client?.profileColumns?.ok ? 'OK' : 'Falha (migração?)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Prospecção • Tavily</span>
                  <span className="font-medium">
                    {checks.qa?.prospecting?.tavilyConfigured ? 'OK' : 'Não configurado'}
                  </span>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
                Esses checks validam “pré‑requisitos” de dados/config para fluxos de Cliente/Colaborador/Admin (não substitui navegação manual).
              </p>
            </div>

            <div className="p-5 rounded-xl border lg:col-span-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>SQL / RPC</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.sql.status, checks.sql.applicable))}`}>
                  {label(effectiveStatus(checks.sql.status, checks.sql.applicable))}
                </span>
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center justify-between">
                  <span>RPC is_admin()</span>
                  <span className="font-medium">{checks.sql.rpc.is_admin}</span>
                </div>
              </div>
            </div>

            {/* cPanel mailbox */}
            <div className="p-5 rounded-xl border lg:col-span-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Mailbox (cPanel)</h2>
                <span className={`px-2 py-1 rounded-full border text-xs font-medium ${pill(effectiveStatus(checks.cpanel.status, checks.cpanel.applicable))}`}>
                  {label(effectiveStatus(checks.cpanel.status, checks.cpanel.applicable))}
                </span>
              </div>
              <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center justify-between">
                  <span>CPANEL_USER</span>
                  <span className="font-medium">{checks.cpanel.env.hasUser ? 'OK' : 'Falta'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CPANEL_PASSWORD</span>
                  <span className="font-medium">{checks.cpanel.env.hasPassword ? 'OK' : 'Falta'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CPANEL_DOMAIN</span>
                  <span className="font-medium">{checks.cpanel.env.hasDomain ? 'OK' : 'Falta'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>WEBMAIL_URL</span>
                  <span className="font-medium">{checks.cpanel.env.hasWebmailUrl ? 'OK' : 'Opcional'}</span>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                A plataforma não expõe webmail internamente; isso só afeta o e-mail de boas-vindas enviado ao e-mail pessoal.
              </p>
            </div>

            {/* Roteiro QA por perfil */}
            <div className="p-5 rounded-xl border lg:col-span-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Roteiro de validação (por perfil)</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="space-y-2">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Super Admin</div>
                  <div className="flex flex-col gap-1">
                    <Link className="underline" href="/admin/centro-inteligencia">Centro de Inteligência</Link>
                    <Link className="underline" href="/admin/analytics/preditivo">Analytics Preditivo</Link>
                    <Link className="underline" href="/admin/machine-learning">Machine Learning</Link>
                    <Link className="underline" href="/admin/financeiro/clientes">Financeiro • Clientes</Link>
                    <Link className="underline" href="/admin/prospeccao">Prospecção</Link>
                    <Link className="underline" href="/admin/solicitacoes">Solicitações</Link>
                    <Link className="underline" href="/admin/diretoria">Diretoria Virtual</Link>
                    <Link className="underline" href="/admin/monitoramento-sentimento">Sentimento</Link>
                    <Link className="underline" href="/admin/rh">RH</Link>
                    <Link className="underline" href="/admin/mensagens">Mensagens</Link>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Colaborador</div>
                  <div className="flex flex-col gap-1">
                    <Link className="underline" href="/colaborador/kanban">Kanban</Link>
                    <Link className="underline" href="/colaborador/clientes">Clientes</Link>
                    <Link className="underline" href="/colaborador/aprovacoes">Aprovações</Link>
                    <Link className="underline" href="/colaborador/solicitacoes">Solicitações</Link>
                    <Link className="underline" href="/colaborador/social/calendario">Social • Calendário</Link>
                    <Link className="underline" href="/colaborador/mensagens">Mensagens</Link>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Cliente</div>
                  <div className="flex flex-col gap-1">
                    <Link className="underline" href="/cliente/dashboard">Dashboard</Link>
                    <Link className="underline" href="/cliente/painel">Painel</Link>
                    <Link className="underline" href="/cliente/painel/insights">Insights</Link>
                    <Link className="underline" href="/cliente/painel/desempenho">Desempenho</Link>
                    <Link className="underline" href="/cliente/painel/concorrentes">Concorrentes</Link>
                    <Link className="underline" href="/cliente/evolucao">Evolução</Link>
                    <Link className="underline" href="/cliente/valle-club">Valle Club</Link>
                  </div>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
                Dica: rode “Rodar agora” no Cron e depois valide se aparecem logs em <code>integration_logs</code> e insights em <code>super_admin_insights</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


