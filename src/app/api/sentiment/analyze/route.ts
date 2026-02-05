/**
 * Valle 360 - API de Análise de Sentimento Automática
 * Endpoint para análise sob demanda e em batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { analyzeAndStore, queueForAnalysis, SentimentSourceType } from '@/lib/ai/sentiment-automation';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));
}

function safeUuid(input?: unknown) {
  const s = String(input || '').trim();
  if (s && isUuid(s)) return s;
  try {
    return crypto.randomUUID();
  } catch {
    // fallback simples
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// POST - Analisar texto (imediato ou fila)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Admin-only: este endpoint grava no banco via service role
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      text, 
      texts, // Para batch
      source_type = 'feedback',
      source_id,
      client_id,
      provider,
      queue = false, // Se true, adiciona à fila em vez de processar imediatamente
      priority = 0
    } = body;

    // Validação
    if (!text && (!texts || !Array.isArray(texts))) {
      return NextResponse.json({ 
        error: 'Texto é obrigatório (text para único ou texts para batch)' 
      }, { status: 400 });
    }

    // Análise em batch
    if (texts && Array.isArray(texts)) {
      const results = [];
      
      for (const item of texts) {
        const itemText = typeof item === 'string' ? item : item.text;
        const itemId = typeof item === 'string' ? safeUuid() : safeUuid(item.id);
        
        if (queue) {
          const queueId = await queueForAnalysis(
            source_type as SentimentSourceType,
            itemId,
            itemText,
            { clientId: client_id, userId: user.id, priority }
          );
          results.push({ id: itemId, queued: true, queue_id: queueId });
        } else {
          const result = await analyzeAndStore(
            source_type as SentimentSourceType,
            itemId,
            itemText,
            { clientId: client_id, userId: user.id, provider }
          );
          results.push(result);
        }
      }

      return NextResponse.json({
        success: true,
        batch: true,
        count: results.length,
        results
      });
    }

    // Análise única
    const id = safeUuid(source_id);

    if (queue) {
      const queueId = await queueForAnalysis(
        source_type as SentimentSourceType,
        id,
        text,
        { clientId: client_id, userId: user.id, priority }
      );

      return NextResponse.json({
        success: true,
        queued: true,
        queue_id: queueId,
        message: 'Texto adicionado à fila de processamento'
      });
    }

    const result = await analyzeAndStore(
      source_type as SentimentSourceType,
      id,
      text,
      { clientId: client_id, userId: user.id, provider }
    );

    if (!result) {
      return NextResponse.json({ 
        error: 'Erro ao processar análise' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('Erro na API de sentimento:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Buscar análises
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const client_id = searchParams.get('client_id');
    const source_type = searchParams.get('source_type');
    const sentiment = searchParams.get('sentiment');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('sentiment_analyses')
      .select('*', { count: 'exact' })
      .order('analyzed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (client_id) query = query.eq('client_id', client_id);
    if (source_type) query = query.eq('source_type', source_type);
    if (sentiment) query = query.eq('overall_sentiment', sentiment);
    if (start_date) query = query.gte('analyzed_at', start_date);
    if (end_date) query = query.lte('analyzed_at', end_date);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count ? offset + limit < count : false
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar análises:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}

