import ClientProfilePage from './ClientProfilePage';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Meu Perfil - Valle 360',
  description: 'Gerencie seu perfil, contrato e benefícios',
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function PerfilPage() {
  return <ClientProfilePage />;
}
