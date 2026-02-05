import './globals.css';
import '@/styles/colors.css';
import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/contexts/AppContext';
import { ToasterProvider } from '@/components/providers/ToasterProvider';

// Forçar SSR para todas as páginas (evita erros de useContext durante build)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Valle 360 - Portal Integrado',
  description: 'Plataforma interna e portal do cliente',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0b1220',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/icons/valle360-icon.png" />
        <link rel="apple-touch-icon" href="/icons/valle360-icon.png" />
      </head>
      <body>
        <AppProvider>
          {children}
          <ToasterProvider />
        </AppProvider>
      </body>
    </html>
  );
}
