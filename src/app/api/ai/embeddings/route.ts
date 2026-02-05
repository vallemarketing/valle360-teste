import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  generateEmbedding, 
  generateBatchEmbeddings, 
  semanticSearch,
  clusterDocuments 
} from '@/lib/integrations/openai/embeddings';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    // Buscar API key da OpenAI
    const { data: config } = await supabase
      .from('integration_configs')
      .select('api_key')
      .eq('integration_id', 'openai')
      .single();

    const apiKey = config?.api_key || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenAI não configurada',
        details: 'Configure a API Key da OpenAI nas integrações'
      }, { status: 400 });
    }

    let result;
    const startTime = Date.now();

    switch (action) {
      case 'embed':
        // Gerar embedding para um texto
        if (!data.text) {
          return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });
        }
        result = await generateEmbedding(data.text, apiKey);
        break;

      case 'embed_batch':
        // Gerar embeddings em lote
        if (!data.texts || !Array.isArray(data.texts)) {
          return NextResponse.json({ error: 'Array de textos é obrigatório' }, { status: 400 });
        }
        result = await generateBatchEmbeddings(data.texts, apiKey);
        break;

      case 'search':
        // Busca semântica
        if (!data.query || !data.documents) {
          return NextResponse.json({ error: 'Query e documentos são obrigatórios' }, { status: 400 });
        }
        result = await semanticSearch(data.query, data.documents, {
          topK: data.topK || 5,
          threshold: data.threshold || 0.5,
          apiKey
        });
        break;

      case 'cluster':
        // Agrupar documentos similares
        if (!data.documents || !Array.isArray(data.documents)) {
          return NextResponse.json({ error: 'Array de documentos é obrigatório' }, { status: 400 });
        }
        result = await clusterDocuments(data.documents, {
          numClusters: data.numClusters || 3,
          apiKey
        });
        break;

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const duration = Date.now() - startTime;

    // Registrar uso
    await supabase.from('integration_logs').insert({
      integration_id: 'openai',
      action: `embeddings_${action}`,
      status: 'success',
      request_data: { action },
      duration_ms: duration
    });

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        action,
        processingTime: duration
      }
    });

  } catch (error: any) {
    console.error('Erro na operação de embeddings:', error);
    return NextResponse.json({ 
      error: 'Erro na operação',
      details: error.message 
    }, { status: 500 });
  }
}






