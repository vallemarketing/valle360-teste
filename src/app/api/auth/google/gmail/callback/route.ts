/**
 * Callback do OAuth do Gmail
 * Recebe o código de autorização e exibe os tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/gmail/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><title>Erro na Autorização</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">❌ Erro na Autorização</h1>
        <p>O Google retornou um erro: <strong>${error}</strong></p>
        <a href="/api/auth/google/gmail">Tentar novamente</a>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!code) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><title>Código não encontrado</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">❌ Código não encontrado</h1>
        <p>O parâmetro 'code' não foi retornado pelo Google.</p>
        <a href="/api/auth/google/gmail">Tentar novamente</a>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    console.log('✅ Tokens Gmail obtidos:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gmail Autorizado!</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #f5f5f5; }
          .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          h1 { color: #10b981; }
          .token-box { background: #1e293b; color: #10b981; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; margin: 10px 0; }
          .warning { background: #fef3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .copy-btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px; }
          .copy-btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Gmail Autorizado com Sucesso!</h1>
          
          <p>Agora você precisa copiar o <strong>Refresh Token</strong> abaixo e adicionar no Vercel.</p>
          
          <h3>🔑 Refresh Token:</h3>
          <div class="token-box" id="refresh-token">${tokens.refresh_token || 'NÃO GERADO - Tente novamente'}</div>
          <button class="copy-btn" onclick="copyToken()">📋 Copiar Refresh Token</button>
          
          <div class="warning">
            <strong>⚠️ IMPORTANTE:</strong><br>
            1. Copie o Refresh Token acima<br>
            2. Vá no Vercel → Settings → Environment Variables<br>
            3. Adicione: <code>GOOGLE_REFRESH_TOKEN</code> = (o token copiado)<br>
            4. Adicione: <code>GMAIL_USER</code> = (seu email que autorizou)<br>
            5. Faça redeploy
          </div>
          
          <h3>📧 Variáveis para adicionar no Vercel:</h3>
          <pre style="background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto;">
GOOGLE_CLIENT_ID=(seu client_id do Google Cloud Console)
GOOGLE_CLIENT_SECRET=(seu client_secret do Google Cloud Console)
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || 'SEU_TOKEN_AQUI'}
GMAIL_USER=seu-email@gmail.com
          </pre>
          
          <p><a href="/admin/colaboradores">← Voltar para Colaboradores</a></p>
        </div>
        
        <script>
          function copyToken() {
            const token = document.getElementById('refresh-token').innerText;
            navigator.clipboard.writeText(token).then(() => {
              alert('Refresh Token copiado!');
            });
          }
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error: any) {
    console.error('Erro ao trocar código por tokens:', error);
    
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><title>Erro ao Obter Tokens</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">❌ Erro ao Obter Tokens</h1>
        <p>${error.message}</p>
        <a href="/api/auth/google/gmail">Tentar novamente</a>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
