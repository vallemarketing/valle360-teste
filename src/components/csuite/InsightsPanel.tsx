'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExecutiveRole } from '@/lib/csuite/executiveTypes';
import { useCsuiteActions, useCsuiteDrafts, useCsuiteInsights } from '@/components/csuite/useCsuiteData';
import { toast } from 'sonner';

function safeArray(v: any) {
  return Array.isArray(v) ? v : [];
}

function labelForRisk(level: string) {
  const l = String(level || '').toLowerCase();
  if (l === 'high' || l === 'critical') return 'alto';
  if (l === 'low') return 'baixo';
  return 'médio';
}

export function InsightsPanel(props: { role: ExecutiveRole }) {
  const { loading, insights, reload } = useCsuiteInsights(props.role);
  const draftsState = useCsuiteDrafts(props.role);
  const actions = useCsuiteActions();

  const draftsByInsightId = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const d of draftsState.drafts || []) {
      const sid = d?.source_insight_id ? String(d.source_insight_id) : '';
      if (!sid) continue;
      map.set(sid, [...(map.get(sid) || []), d]);
    }
    return map;
  }, [draftsState.drafts]);

  const createDraft = async (insight: any, action: any) => {
    try {
      await actions.draftFromInsight({ role: props.role, source_insight_id: String(insight.id), action });
      toast.success('Rascunho criado.');
      await draftsState.reload();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao criar rascunho');
    }
  };

  const confirm = async (draftId: string) => {
    try {
      await actions.confirmDraft(draftId);
      toast.success('Ação executada.');
      await draftsState.reload();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao executar');
    }
  };

  const list = (insights || []).slice(0, 12);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Insights (sem mocks) com evidências e CTAs consultivos.
        </div>
        <Button variant="outline" onClick={() => reload()} disabled={loading}>
          Atualizar
        </Button>
      </div>

      {!list.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sem insights ainda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Rode o cron de ML/alertas e gere insights. Se as tabelas do C‑Suite ainda não existirem neste ambiente,
              rode a migration/SQL consolidado.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {list.map((i: any) => {
            const actionsList = safeArray(i?.recommended_actions);
            const relatedDrafts = draftsByInsightId.get(String(i.id)) || [];
            return (
              <Card key={i.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{String(i.title || 'Insight')}</CardTitle>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge>{String(i.category || 'general')}</Badge>
                      <Badge variant="secondary">{String(i.insight_type || 'strategy')}</Badge>
                      {i.urgency ? <Badge variant="outline">urgência: {String(i.urgency)}</Badge> : null}
                      {i.impact_level ? <Badge variant="outline">impacto: {String(i.impact_level)}</Badge> : null}
                      {i.confidence_score != null ? (
                        <Badge variant="outline">confiança: {Math.round(Number(i.confidence_score) * 100)}%</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{i.created_at ? new Date(i.created_at).toLocaleString('pt-BR') : ''}</div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {String(i.description || '')}
                  </div>

                  {!!actionsList.length && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        CTAs sugeridos (rascunho → confirmação)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {actionsList.slice(0, 5).map((a: any, idx: number) => {
                          const requiresExternal = Boolean(a?.requires_external);
                          const risk = labelForRisk(a?.risk_level);
                          return (
                            <Button
                              key={idx}
                              variant={requiresExternal ? 'outline' : 'default'}
                              className={requiresExternal ? '' : 'bg-[#1672d6] hover:bg-[#1260b5]'}
                              onClick={() => createDraft(i, a)}
                              title={requiresExternal ? 'Vai gerar rascunho (não executável automático)' : 'Gera rascunho executável (com sua confirmação)'}
                            >
                              {String(a?.label || 'Criar rascunho')} · risco {risk}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!!relatedDrafts.length && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Rascunhos gerados
                      </div>
                      <div className="space-y-2">
                        {relatedDrafts.slice(0, 3).map((d: any) => {
                          const isExecutable = Boolean(d.is_executable) && !Boolean(d.requires_external);
                          const status = String(d.status || 'draft');
                          return (
                            <div key={d.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {String(d.preview?.label || d.action_type || 'Ação')}
                                </div>
                                <div className="text-xs text-gray-600">
                                  status: {status} · executável: {isExecutable ? 'sim' : 'não'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {status === 'draft' && isExecutable ? (
                                  <Button
                                    onClick={() => confirm(String(d.id))}
                                    disabled={actions.workingId === String(d.id)}
                                    className="bg-[#1672d6] hover:bg-[#1260b5]"
                                  >
                                    Confirmar
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

