import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'campaign' | 'metric' | 'achievement';
  metrics?: {
    label: string;
    before: number;
    after: number;
    unit?: string;
  }[];
  image?: string;
}

// GET: Buscar timeline do cliente
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id, created_at')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar eventos salvos do timeline
    const { data: savedEvents, error: eventsError } = await supabase
      .from('client_timeline_events')
      .select('*')
      .eq('client_id', client.id)
      .order('event_date', { ascending: true });

    if (eventsError && eventsError.code !== 'PGRST116') {
      // Se a tabela não existe, vamos gerar eventos automaticamente
      console.log('Tabela não existe, gerando eventos automáticos');
    }

    // Se não há eventos salvos, gerar automaticamente baseado em dados
    let events: TimelineEvent[] = [];

    if (!savedEvents || savedEvents.length === 0) {
      events = await generateAutomaticTimeline(supabase, client.id, client.created_at);
    } else {
      events = savedEvents.map(e => ({
        id: e.id,
        date: e.event_date,
        title: e.title,
        description: e.description,
        type: e.event_type,
        metrics: e.metrics,
        image: e.image_url
      }));
    }

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('Erro ao buscar timeline:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Adicionar evento ao timeline
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, type, date, metrics, imageUrl } = body;

    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const { data: event, error } = await supabase
      .from('client_timeline_events')
      .insert({
        client_id: client.id,
        event_date: date,
        title,
        description,
        event_type: type,
        metrics: metrics || null,
        image_url: imageUrl || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Gerar timeline automático baseado em dados históricos
async function generateAutomaticTimeline(
  supabase: any, 
  clientId: string, 
  createdAt: string
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];
  const startDate = new Date(createdAt);

  // Evento inicial - Início da parceria
  events.push({
    id: 'start',
    date: createdAt,
    title: 'Início da Parceria',
    description: 'Começamos nossa jornada juntos! Análise inicial e definição de estratégia.',
    type: 'milestone',
    metrics: await getMetricsForDate(supabase, clientId, startDate)
  });

  // Buscar marcos importantes baseados em dados
  // 1. Campanhas lançadas
  const { data: campaigns } = await supabase
    .from('marketing_campaigns')
    .select('id, name, start_date, results')
    .eq('client_id', clientId)
    .order('start_date', { ascending: true })
    .limit(5);

  if (campaigns) {
    for (const campaign of campaigns) {
      events.push({
        id: campaign.id,
        date: campaign.start_date,
        title: campaign.name,
        description: 'Lançamento de nova campanha estratégica.',
        type: 'campaign',
        metrics: await getMetricsForDate(supabase, clientId, new Date(campaign.start_date))
      });
    }
  }

  // 2. Achievements/conquistas
  const { data: achievements } = await supabase
    .from('client_achievements')
    .select('*')
    .eq('client_id', clientId)
    .order('earned_at', { ascending: true });

  if (achievements) {
    for (const achievement of achievements) {
      events.push({
        id: achievement.id,
        date: achievement.earned_at,
        title: achievement.title,
        description: achievement.description,
        type: 'achievement'
      });
    }
  }

  // 3. Snapshots de métricas mensais
  const { data: snapshots } = await supabase
    .from('social_metrics_snapshots')
    .select('*')
    .eq('client_id', clientId)
    .order('snapshot_date', { ascending: true });

  if (snapshots && snapshots.length > 0) {
    // Adicionar evento de métricas trimestrais
    const quarterlySnapshots = snapshots.filter((_: any, i: number) => i % 3 === 0);
    
    for (let i = 1; i < quarterlySnapshots.length; i++) {
      const current = quarterlySnapshots[i];
      const previous = quarterlySnapshots[i - 1];
      
      events.push({
        id: `metrics-${i}`,
        date: current.snapshot_date,
        title: `Resultados do Trimestre`,
        description: 'Evolução das métricas no período.',
        type: 'metric',
        metrics: [
          {
            label: 'Seguidores',
            before: previous.followers_count || 0,
            after: current.followers_count || 0
          },
          {
            label: 'Engajamento',
            before: previous.engagement_rate || 0,
            after: current.engagement_rate || 0,
            unit: '%'
          },
          {
            label: 'Alcance',
            before: previous.reach_count || 0,
            after: current.reach_count || 0
          }
        ]
      });
    }
  }

  // Ordenar por data
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return events;
}

// Buscar métricas para uma data específica
async function getMetricsForDate(
  supabase: any, 
  clientId: string, 
  date: Date
): Promise<TimelineEvent['metrics']> {
  const { data: snapshot } = await supabase
    .from('social_metrics_snapshots')
    .select('*')
    .eq('client_id', clientId)
    .lte('snapshot_date', date.toISOString())
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (!snapshot) {
    return [
      { label: 'Seguidores', before: 0, after: 0 },
      { label: 'Engajamento', before: 0, after: 0, unit: '%' },
      { label: 'Alcance', before: 0, after: 0 }
    ];
  }

  return [
    { label: 'Seguidores', before: snapshot.followers_count, after: snapshot.followers_count },
    { label: 'Engajamento', before: snapshot.engagement_rate, after: snapshot.engagement_rate, unit: '%' },
    { label: 'Alcance', before: snapshot.reach_count, after: snapshot.reach_count }
  ];
}
