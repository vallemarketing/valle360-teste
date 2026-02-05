"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SocialAccountConnect from "@/components/social/SocialAccountConnect";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ApiAccount = {
  id: string;
  platform: "instagram" | "facebook" | "linkedin" | "twitter" | "tiktok" | "youtube";
  external_account_id: string;
  username: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
  status: "active" | "expired" | "error";
  metadata: any;
};

type SocialAccount = {
  id: string;
  platform: ApiAccount["platform"];
  username: string;
  displayName: string;
  profileImage?: string;
  connected: boolean;
  connectedAt?: Date;
  expiresAt?: Date;
  permissions: string[];
  status: "active" | "expired" | "error";
};

export default function RedesSociaisPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const prodBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const prodOrigin = (() => {
    try {
      return prodBaseUrl ? new URL(prodBaseUrl).origin : "";
    } catch {
      return "";
    }
  })();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || null;
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const meR = await fetch("/api/client/me", { cache: "no-store", headers: authHeaders });
      const meJ = await meR.json();
      if (!meR.ok) throw new Error(meJ?.error || "Falha ao carregar cliente");
      setClientId(String(meJ?.client?.id));

      const r = await fetch("/api/client/social/accounts", { cache: "no-store", headers: authHeaders });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Falha ao carregar contas");
      setAccounts((j?.accounts || []) as ApiAccount[]);
    } catch (e: any) {
      setError(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // feedback do callback quando OAuth roda na mesma aba (sem window.opener)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const connected = url.searchParams.get("connected") === "1";
    if (!connected) return;

    const ok = url.searchParams.get("ok") === "1";
    const platform = url.searchParams.get("platform") || "rede";
    const errMsg = url.searchParams.get("error") || "";

    if (ok) {
      toast.success("Conta conectada!", { description: `Plataforma: ${platform}` });
    } else {
      toast.error("Falha ao conectar", { description: errMsg || `Plataforma: ${platform}` });
    }

    // limpa query para não repetir toast no refresh
    router.replace("/cliente/redes");

    // Atualiza lista após callback
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return;
      const data: any = ev.data;
      if (data?.type === "oauth_connected") {
        load();
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapped = useMemo<SocialAccount[]>(() => {
    return accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      username: a.username ? (a.username.startsWith("@") ? a.username : `@${a.username}`) : a.display_name || a.external_account_id,
      displayName: a.display_name || a.username || a.external_account_id,
      profileImage: a.profile_picture_url || undefined,
      connected: true,
      connectedAt: undefined,
      expiresAt: undefined,
      permissions: [],
      status: a.status || "active",
    }));
  }, [accounts]);

  function openOAuth(platform: string) {
    if (!clientId) {
      setError("Você precisa estar logado como Cliente (com perfil vinculado) para conectar redes. Recarregue ou faça login novamente.");
      return;
    }
    if (platform !== "instagram" && platform !== "facebook" && platform !== "linkedin") {
      setError("Conexão para esta plataforma ainda não está disponível.");
      return;
    }

    // Produção only: evita tentar OAuth em domínios de preview (o Meta costuma rejeitar redirect_uri)
    if (prodOrigin && typeof window !== "undefined" && window.location.origin !== prodOrigin) {
      setError(`Conexão disponível apenas em Produção. Acesse: ${prodBaseUrl || prodOrigin}`);
      return;
    }

    const url = `/api/oauth/${platform}?client_id=${encodeURIComponent(clientId)}`;
    // Sem popup (evita bloqueio de navegador)
    window.location.assign(url);
  }

  async function disconnect(accountId: string) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || null;
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`/api/client/social/accounts?account_id=${encodeURIComponent(accountId)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Falha ao desconectar");
      await load();
    } catch (e: any) {
      setError(e?.message || "Erro ao desconectar");
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">{error}</div>}
      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="h-4 w-40 bg-muted rounded mb-3" />
          <div className="h-4 w-64 bg-muted rounded" />
              </div>
      ) : !clientId ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">Minhas Redes Sociais</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Para conectar redes sociais, você precisa estar logado como <span className="font-semibold">Cliente</span> e ter seu cadastro vinculado.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => load()}
              className="px-4 py-2 rounded-lg bg-[#1672d6] text-white text-sm"
            >
              Recarregar
            </button>
            <a href="/login" className="px-4 py-2 rounded-lg border border-border text-sm text-foreground">
              Ir para Login
            </a>
          </div>
        </div>
      ) : (
        <SocialAccountConnect
          clientId={clientId || "unknown"}
          accounts={mapped as any}
          onConnect={openOAuth}
          onDisconnect={disconnect}
          onRefresh={() => {
            // reconectar: reaproveita o fluxo OAuth (mesmo botão)
            setError("Para reconectar, clique em Conectar novamente na plataforma.");
          }}
          isClientView
        />
      )}
    </div>
  );
}


