/**
 * Valle 360 - Middleware (hardening mínimo)
 *
 * Mantemos o middleware o mais simples possível e aplicamos somente para rotas
 * de setup/provisionamento que não devem ficar públicas em produção.
 */

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const setupEnabled = process.env.ENABLE_SETUP_ROUTES === '1';

  if (isProd && !setupEnabled) {
    // Retorna 404 para não “anunciar” a rota.
    return new Response('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // páginas de setup
    '/criar-admin-guilherme',
    '/setup-admin',
    '/setup-usuarios-teste',
    '/criar-acessos-simples',

    // endpoints de setup/provisionamento
    '/api/create-admin',
    '/api/create-admin-guilherme',
    '/api/admin/create-users',
  ],
};

