import Link from 'next/link';
import CallbackClient from './ui';

export const dynamic = 'force-dynamic';

export default function ClienteRedesCallbackPage(props: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sp = props.searchParams || {};
  const platform = typeof sp.platform === 'string' ? sp.platform : 'unknown';
  const ok = (typeof sp.ok === 'string' ? sp.ok : '0') === '1';
  const error = typeof sp.error === 'string' ? sp.error : '';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <CallbackClient platform={platform} ok={ok} error={error} />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-bold text-foreground">{ok ? 'Conta conectada com sucesso' : 'Falha ao conectar'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{ok ? `Plataforma: ${platform}` : error || `Plataforma: ${platform}`}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Você pode fechar esta janela. Se ela não fechar automaticamente, volte para a Valle 360 e atualize a página.
        </p>
        <div className="mt-6">
          <Link href="/cliente/redes" className="text-sm underline text-primary">
            Voltar para Redes Sociais
          </Link>
        </div>
      </div>
    </div>
  );
}


