import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    
    // Get client
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('id, company_name, nome_fantasia')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (clientError || !client?.id) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 400 });
    }

    const body = await request.json();
    const { items } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'items é obrigatório' }, { status: 400 });
    }

    const clientName = (client as any).company_name || (client as any).nome_fantasia || 'Cliente';

    // Create briefing record
    const { data: briefing, error: briefingError } = await admin
      .from('client_briefings')
      .insert({
        client_id: client.id,
        status: 'pending',
        items: items,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    // If table doesn't exist, create tasks directly in Kanban
    if (briefingError) {
      console.log('client_briefings table not found, creating tasks directly');
    }

    // Create tasks in Kanban for each briefing item
    const createdTasks: any[] = [];
    
    for (const item of items) {
      // Map briefing type to area
      const areaMap: Record<string, string> = {
        'post': 'social_media',
        'campanha': 'marketing',
        'video': 'video',
        'arte': 'design',
        'site': 'dev',
        'outro': 'operations',
      };

      const taskData = {
        client_id: client.id,
        title: `[Briefing] ${item.title}`,
        description: item.description || '',
        status: 'backlog',
        priority: item.deadline ? 'high' : 'medium',
        area: areaMap[item.type] || 'operations',
        due_date: item.deadline || null,
        tags: [item.type, 'briefing', 'cliente'],
        metadata: {
          source: 'client_briefing',
          briefing_id: briefing?.id,
          references: item.references || [],
          attachments: item.attachments || [],
          client_name: clientName,
        },
        created_at: new Date().toISOString(),
      };

      try {
        const { data: task, error: taskError } = await admin
          .from('kanban_tasks')
          .insert(taskData)
          .select()
          .single();
        
        if (!taskError && task) {
          createdTasks.push(task);
        }
      } catch (e) {
        console.error('Error creating task:', e);
      }
    }

    // Send notification to team
    try {
      await admin
        .from('notifications')
        .insert({
          type: 'briefing_received',
          title: 'Novo Briefing Recebido',
          message: `${clientName} enviou um briefing com ${items.length} item(s)`,
          data: {
            client_id: client.id,
            briefing_id: briefing?.id,
            items_count: items.length,
          },
          read: false,
          created_at: new Date().toISOString(),
        });
    } catch (e) {
      // Notification table might not exist
    }

    return NextResponse.json({
      success: true,
      briefing_id: briefing?.id,
      tasks_created: createdTasks.length,
      message: 'Briefing enviado com sucesso!',
    });
  } catch (e: any) {
    console.error('Briefing submission error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    
    // Get client
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!client?.id) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 400 });
    }

    // Get briefings history
    let briefings: any[] = [];
    try {
      const { data: briefingsData } = await admin
        .from('client_briefings')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      
      briefings = briefingsData || [];
    } catch (e) {
      // Table might not exist
    }

    return NextResponse.json({
      success: true,
      briefings,
    });
  } catch (e: any) {
    console.error('Get briefings error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
