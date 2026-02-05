/**
 * API para testar integrações (SendGrid, cPanel)
 * Permite verificar se as configurações estão corretas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // ========== MAILTO (ENVIO MANUAL) ==========
    results.sendgrid = {
      configured: true,
      mode: 'mailto',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@valle360.com.br',
      fromName: process.env.SENDGRID_FROM_NAME || 'Valle 360',
      connectionTest: 'MAILTO',
    };

    // ========== TESTE CPANEL ==========
    const cpanelUser = (process.env.CPANEL_USER || '').trim();
    const cpanelPassword = (process.env.CPANEL_PASSWORD || '').trim();
    const cpanelDomain = (process.env.CPANEL_DOMAIN || '').trim();

    results.cpanel = {
      configured: !!(cpanelUser && cpanelPassword && cpanelDomain),
      user: cpanelUser || 'NÃO CONFIGURADO',
      passwordSet: cpanelPassword ? 'SIM (****)' : 'NÃO CONFIGURADO',
      domain: cpanelDomain || 'NÃO CONFIGURADO',
    };

    // Testar conexão cPanel
    if (cpanelUser && cpanelPassword && cpanelDomain) {
      try {
        const basicAuth = Buffer.from(`${cpanelUser}:${cpanelPassword}`).toString('base64');
        
        // Normalizar URL do cPanel
        let baseUrl = cpanelDomain;
        if (!/^https?:\/\//i.test(baseUrl)) {
          baseUrl = `https://${baseUrl}`;
        }
        baseUrl = baseUrl.replace(/\/+$/, '');

        // Testar com endpoint simples
        const testUrl = `${baseUrl}/execute/Email/list_pops`;
        
        const cpResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
          },
        });

        const responseText = await cpResponse.text();
        
        if (cpResponse.ok && !responseText.includes('<!DOCTYPE')) {
          try {
            const data = JSON.parse(responseText);
            results.cpanel.connectionTest = 'SUCCESS';
            results.cpanel.emailAccounts = data.data?.length || 0;
          } catch {
            results.cpanel.connectionTest = 'PARTIAL';
            results.cpanel.note = 'Resposta não é JSON válido';
          }
        } else if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          results.cpanel.connectionTest = 'FAILED';
          results.cpanel.error = 'cPanel retornou página HTML (provável erro de autenticação ou URL incorreta)';
          results.cpanel.hint = 'Verifique: 1) URL com porta (ex: https://servidor:2083), 2) Usuário/senha corretos, 3) IP não bloqueado';
        } else {
          results.cpanel.connectionTest = 'FAILED';
          results.cpanel.error = `Status ${cpResponse.status}`;
          results.cpanel.responsePreview = responseText.substring(0, 200);
        }
      } catch (cpError: any) {
        results.cpanel.connectionTest = 'ERROR';
        results.cpanel.error = cpError.message;
      }
    }

    // ========== VERIFICAR DB ==========
    const { data: dbConfig } = await supabase
      .from('integration_configs')
      .select('integration_id, status')
      .in('integration_id', ['sendgrid', 'cpanel']);

    results.database = {
      integrations: dbConfig || [],
    };

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error: any) {
    console.error('[TestIntegrations] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
