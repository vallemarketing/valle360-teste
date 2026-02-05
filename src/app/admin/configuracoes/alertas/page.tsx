'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Save, RefreshCw, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Channel = 'email' | 'intranet';
type Rule = {
  id?: string;
  alert_type: string;
  channel: Channel;
  recipient_user_id?: string | null;
  recipient_email?: string | null;
  is_enabled?: boolean;
};

type UserRow = { user_id: string | null; email: string | null; role: string | null; user_type: string | null; is_active: boolean };

const ALERT_TYPES = [
  { id: 'payment_risk', label: 'Risco de Pagamento' },
  { id: 'budget_overrun', label: 'Orçamento estourando' },
  { id: 'demand_capacity', label: 'Demanda vs Capacidade' },
  { id: 'churn', label: 'Risco de Churn' },
];

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function normEmail(v: string) {
  return v.trim().toLowerCase();
}

export default function AlertRecipientsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedType, setSelectedType] = useState<string>(ALERT_TYPES[0].id);
  const [newEmail, setNewEmail] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/alerts/recipients', { headers, cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao carregar');
      setRules(Array.isArray(json.rules) ? json.rules : []);
      setUsers(Array.isArray(json.users) ? json.users : []);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao carregar');
      setRules([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rulesForType = useMemo(() => rules.filter((r) => r.alert_type === selectedType), [rules, selectedType]);

  const emailRules = useMemo(() => rulesForType.filter((r) => r.channel === 'email' && r.is_enabled !== false), [rulesForType]);
  const intranetRules = useMemo(
    () => rulesForType.filter((r) => r.channel === 'intranet' && r.is_enabled !== false),
    [rulesForType]
  );

  const selectedUserIdsEmail = useMemo(
    () => new Set(emailRules.map((r) => String(r.recipient_user_id || '')).filter(Boolean)),
    [emailRules]
  );
  const selectedUserIdsIntranet = useMemo(
    () => new Set(intranetRules.map((r) => String(r.recipient_user_id || '')).filter(Boolean)),
    [intranetRules]
  );
  const externalEmails = useMemo(
    () => emailRules.map((r) => String(r.recipient_email || '')).filter(Boolean),
    [emailRules]
  );

  const toggleUser = (channel: Channel, userId: string) => {
    setRules((prev) => {
      const next = prev.filter((r) => r.alert_type !== selectedType); // we'll rebuild selectedType block
      const current = prev.filter((r) => r.alert_type === selectedType);

      const exists = current.some((r) => r.channel === channel && String(r.recipient_user_id || '') === userId && r.is_enabled !== false);
      const filtered = current.filter((r) => !(r.channel === channel && String(r.recipient_user_id || '') === userId));
      const updated = exists
        ? filtered
        : [
            ...filtered,
            { alert_type: selectedType, channel, recipient_user_id: userId, recipient_email: null, is_enabled: true } as Rule,
          ];
      return [...next, ...updated];
    });
  };

  const addExternalEmail = () => {
    const email = normEmail(newEmail);
    if (!email || !email.includes('@')) return toast.error('Email inválido');
    setNewEmail('');
    setRules((prev) => {
      const next = prev.filter((r) => r.alert_type !== selectedType);
      const current = prev.filter((r) => r.alert_type === selectedType);
      const exists = current.some((r) => r.channel === 'email' && normEmail(String(r.recipient_email || '')) === email);
      if (exists) return prev;
      return [
        ...next,
        ...current,
        { alert_type: selectedType, channel: 'email', recipient_email: email, recipient_user_id: null, is_enabled: true },
      ];
    });
  };

  const removeExternalEmail = (email: string) => {
    setRules((prev) => prev.filter((r) => !(r.alert_type === selectedType && r.channel === 'email' && normEmail(String(r.recipient_email || '')) === normEmail(email))));
  };

  const save = async () => {
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const payloadRules = rules.filter((r) => r.alert_type === selectedType);
      const res = await fetch('/api/admin/alerts/recipients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ alert_type: selectedType, rules: payloadRules }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao salvar');
      toast.success('Salvo.');
      // refresh from server to reflect uniques/normalization
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const userList = useMemo(() => {
    return (users || [])
      .filter((u) => u.user_id && u.email)
      .sort((a, b) => String(a.email || '').localeCompare(String(b.email || ''), 'pt-BR'));
  }, [users]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Destinatários de Alertas</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Controle via banco/UI (sem depender de env). Resolução do sistema: env → banco → fallback (admins).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => load()} disabled={loading} className="gap-2">
              <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} /> Atualizar
            </Button>
            <Button onClick={save} disabled={saving || loading} className="gap-2 bg-[#1672d6] hover:bg-[#1260b5]">
              <Save className="w-4 h-4" /> Salvar
            </Button>
            <Link href="/admin/configuracoes" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Voltar
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALERT_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-2 rounded-xl border text-sm ${selectedType === t.id ? 'bg-white' : 'bg-transparent'}`}
              style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              {t.label}
              {t.id === selectedType ? <span className="ml-2 text-xs text-gray-500">editando</span> : null}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Email <Badge variant="outline">{emailRules.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">Usuários internos (email) + emails externos.</div>

              <div className="flex gap-2">
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Adicionar email externo…"
                  className="flex-1 px-3 py-2 rounded-xl border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                />
                <Button onClick={addExternalEmail} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" /> Adicionar
                </Button>
              </div>

              {!!externalEmails.length && (
                <div className="flex flex-wrap gap-2">
                  {externalEmails.map((e) => (
                    <span key={e} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs">
                      {e}
                      <button onClick={() => removeExternalEmail(e)} title="Remover">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <div className="text-xs font-semibold text-gray-600 mb-2">Usuários</div>
                <div className="max-h-[340px] overflow-auto space-y-2">
                  {userList.map((u) => {
                    const id = String(u.user_id);
                    const checked = selectedUserIdsEmail.has(id);
                    return (
                      <label key={id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{u.email}</span>
                        <input type="checkbox" checked={checked} onChange={() => toggleUser('email', id)} />
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Intranet <Badge variant="outline">{intranetRules.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">Mensagens internas (direct_messages) — precisa do ALERTS_ACTOR_USER_ID.</div>

              <div className="max-h-[420px] overflow-auto space-y-2">
                {userList.map((u) => {
                  const id = String(u.user_id);
                  const checked = selectedUserIdsIntranet.has(id);
                  return (
                    <label key={id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{u.email}</span>
                      <input type="checkbox" checked={checked} onChange={() => toggleUser('intranet', id)} />
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

