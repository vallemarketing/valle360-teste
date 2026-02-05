import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createCheckoutSession, getStripeClient } from '@/lib/integrations/stripe/client';

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

    // Buscar configuração da integração
    const { data: config, error: configError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_id', 'stripe')
      .single();

    if (configError || !config || config.status !== 'connected') {
      return NextResponse.json({ 
        error: 'Stripe não está conectado',
        needsSetup: true 
      }, { status: 400 });
    }

    const body = await request.json();
    const { 
      items, 
      mode = 'payment',
      customerId,
      customerEmail,
      successUrl,
      cancelUrl,
      metadata
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items são obrigatórios' }, { status: 400 });
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'URLs de sucesso e cancelamento são obrigatórias' }, { status: 400 });
    }

    // Formatar items para o Stripe
    const lineItems = items.map((item: any) => {
      if (item.priceId) {
        return { priceId: item.priceId, quantity: item.quantity || 1 };
      }
      return {
        name: item.name,
        amount: Math.round(item.price * 100), // Converter para centavos
        quantity: item.quantity || 1
      };
    });

    const session = await createCheckoutSession({
      customerId,
      customerEmail,
      lineItems,
      mode: mode as 'payment' | 'subscription',
      successUrl,
      cancelUrl,
      metadata: {
        ...metadata,
        userId: user.id
      }
    }, config.api_key);

    // Registrar log
    await supabase.from('integration_logs').insert({
      integration_id: 'stripe',
      action: 'create_checkout',
      status: 'success',
      request_data: { mode, itemsCount: items.length },
      response_data: { sessionId: session.id }
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Erro ao criar checkout:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar checkout',
      details: error.message 
    }, { status: 500 });
  }
}

// GET para listar produtos/preços disponíveis
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_id', 'stripe')
      .single();

    if (!config || config.status !== 'connected') {
      return NextResponse.json({ error: 'Stripe não está conectado' }, { status: 400 });
    }

    const stripe = getStripeClient(config.api_key);

    // Buscar produtos ativos
    const products = await stripe.products.list({ active: true, limit: 100 });
    
    // Buscar preços para cada produto
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({ product: product.id, active: true });
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          prices: prices.data.map(price => ({
            id: price.id,
            unitAmount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring ? {
              interval: price.recurring.interval,
              intervalCount: price.recurring.interval_count
            } : null
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      products: productsWithPrices
    });

  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ 
      error: 'Erro ao listar produtos',
      details: error.message 
    }, { status: 500 });
  }
}






