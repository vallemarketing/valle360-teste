/**
 * Rota para autorização OAuth do Gmail
 * 
 * GET: Redireciona para tela de autorização do Google
 * POST: Troca o código de autorização por tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/gmail/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configurados');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// GET - Redireciona para autorização do Google
export async function GET(request: NextRequest) {
  try {
    const oauth2Client = getOAuth2Client();
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Força mostrar tela de consentimento para obter refresh_token
    });

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      help: 'Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no Vercel',
    }, { status: 500 });
  }
}

// POST - Recebe código e retorna tokens
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código de autorização não fornecido' }, { status: 400 });
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    console.log('✅ Tokens obtidos:', {
      access_token: tokens.access_token ? '***' : null,
      refresh_token: tokens.refresh_token ? '***' : null,
      expiry_date: tokens.expiry_date,
    });

    return NextResponse.json({
      success: true,
      message: 'Tokens gerados com sucesso!',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
      instructions: 'Adicione GOOGLE_REFRESH_TOKEN no Vercel com o valor do refresh_token acima',
    });
  } catch (error: any) {
    console.error('Erro ao trocar código por tokens:', error);
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}
