import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { notifyEvent } from '@/lib/notifications/multiChannel';

/**
 * Schedule or publish a post
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const supabaseAdmin = getSupabaseAdmin();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      copy,
      hashtags,
      cta,
      visualPrompt,
      mediaUrls,
      platforms,
      scheduledAt,
      publishImmediately,
      demandType,
      kanbanTaskId,
    } = body;

    // Validations
    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }
    if (!copy || copy.trim().length === 0) {
      return NextResponse.json({ error: 'copy é obrigatório' }, { status: 400 });
    }
    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Selecione pelo menos uma plataforma' }, { status: 400 });
    }

    // Get approval flow config for client
    const { data: approvalConfig } = await supabaseAdmin
      .from('client_approval_flows')
      .select('*')
      .eq('client_id', clientId)
      .single();

    // Determine initial status based on approval flow
    let status = 'pending_approval';
    let approvalStep = 'head';

    if (approvalConfig?.flow_type === 'direct') {
      status = publishImmediately ? 'publishing' : 'scheduled';
      approvalStep = 'complete';
    }

    // Create the scheduled post
    const { data: post, error: postError } = await supabaseAdmin
      .from('scheduled_posts')
      .insert({
        client_id: clientId,
        copy,
        hashtags: hashtags || [],
        cta,
        visual_prompt: visualPrompt,
        media_urls: mediaUrls || [],
        platforms,
        scheduled_at: scheduledAt || null,
        publish_immediately: publishImmediately || false,
        status,
        approval_flow_step: approvalStep,
        ai_generated: true,
        demand_type: demandType,
        kanban_task_id: kanbanTaskId,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (postError) {
      console.error('Error creating scheduled post:', postError);
      return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 });
    }

    // Log approval history
    await supabaseAdmin.from('post_approval_history').insert({
      post_id: post.id,
      action: 'created',
      step: 'creation',
      performed_by: user.id,
      performed_by_role: 'collaborator',
    });

    // If direct publish, trigger publishing
    if (approvalConfig?.flow_type === 'direct' && publishImmediately) {
      // TODO: Trigger actual publishing via background job
      // For now, just mark as published
      await supabaseAdmin
        .from('scheduled_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      // Notify creator
      await notifyEvent('post_published', user.id, {
        postId: post.id,
        platforms: platforms.join(', '),
      });
    } else {
      // Notify head/admin about pending approval
      const { data: heads } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id')
        .in('role', ['super_admin', 'head']);

      for (const head of heads || []) {
        await notifyEvent('post_pending_approval', head.user_id, {
          postId: post.id,
          clientName: clientId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      postId: post.id,
      status,
      message: status === 'pending_approval' 
        ? 'Post enviado para aprovação'
        : status === 'scheduled'
        ? 'Post agendado com sucesso'
        : 'Post publicado com sucesso',
    });
  } catch (error: any) {
    console.error('Publish API error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * Get scheduled posts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const clientId = request.nextUrl.searchParams.get('client_id');
    const status = request.nextUrl.searchParams.get('status');

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return NextResponse.json({ error: 'Erro ao buscar posts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
    });
  } catch (error: any) {
    console.error('Get scheduled posts error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * Approve or reject a post
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const supabaseAdmin = getSupabaseAdmin();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, action, reason } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId é obrigatório' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action deve ser approve ou reject' }, { status: 400 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = profile?.role || 'collaborator';

    // Get post
    const { data: post, error: postError } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, clients(name)')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    // Get approval flow config
    const { data: approvalConfig } = await supabaseAdmin
      .from('client_approval_flows')
      .select('*')
      .eq('client_id', post.client_id)
      .single();

    const flowType = approvalConfig?.flow_type || 'head_only';
    const requiresClientApproval = approvalConfig?.require_client_approval ?? true;

    if (action === 'reject') {
      // Rejection
      await supabaseAdmin
        .from('scheduled_posts')
        .update({
          status: 'rejected',
          rejection_reason: reason || 'Reprovado',
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', postId);

      // Log
      await supabaseAdmin.from('post_approval_history').insert({
        post_id: postId,
        action: 'rejected',
        step: post.approval_flow_step,
        performed_by: user.id,
        performed_by_role: role,
        comments: reason,
      });

      // Notify creator
      if (post.created_by) {
        await notifyEvent('post_rejected', post.created_by, {
          postId,
          reason: reason || 'Sem motivo especificado',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Post reprovado',
      });
    }

    // Approval - determine next step
    let nextStep = post.approval_flow_step;
    let newStatus = post.status;
    const updates: any = {};

    if (flowType === 'head_only') {
      if (post.approval_flow_step === 'head' && role === 'super_admin') {
        updates.approved_by_head = user.id;
        updates.approved_by_head_at = new Date().toISOString();
        
        if (requiresClientApproval) {
          nextStep = 'client';
        } else {
          nextStep = 'complete';
          newStatus = post.publish_immediately ? 'publishing' : 'scheduled';
        }
      } else if (post.approval_flow_step === 'client' && role === 'client') {
        updates.approved_by_client = user.id;
        updates.approved_by_client_at = new Date().toISOString();
        nextStep = 'complete';
        newStatus = post.publish_immediately ? 'publishing' : 'scheduled';
      }
    } else if (flowType === 'head_admin') {
      if (post.approval_flow_step === 'head') {
        updates.approved_by_head = user.id;
        updates.approved_by_head_at = new Date().toISOString();
        nextStep = 'admin';
      } else if (post.approval_flow_step === 'admin' && role === 'super_admin') {
        updates.approved_by_admin = user.id;
        updates.approved_by_admin_at = new Date().toISOString();
        
        if (requiresClientApproval) {
          nextStep = 'client';
        } else {
          nextStep = 'complete';
          newStatus = post.publish_immediately ? 'publishing' : 'scheduled';
        }
      } else if (post.approval_flow_step === 'client' && role === 'client') {
        updates.approved_by_client = user.id;
        updates.approved_by_client_at = new Date().toISOString();
        nextStep = 'complete';
        newStatus = post.publish_immediately ? 'publishing' : 'scheduled';
      }
    }

    // Update post
    await supabaseAdmin
      .from('scheduled_posts')
      .update({
        ...updates,
        approval_flow_step: nextStep,
        status: nextStep === 'complete' ? (newStatus === 'publishing' ? 'approved' : 'scheduled') : 'pending_approval',
      })
      .eq('id', postId);

    // Log
    await supabaseAdmin.from('post_approval_history').insert({
      post_id: postId,
      action: 'approved',
      step: post.approval_flow_step,
      performed_by: user.id,
      performed_by_role: role,
    });

    // Notify
    if (nextStep === 'complete' && post.created_by) {
      await notifyEvent('post_approved', post.created_by, {
        postId,
        by: role,
      });
    }

    return NextResponse.json({
      success: true,
      message: nextStep === 'complete' ? 'Post aprovado!' : `Aprovado. Próximo: ${nextStep}`,
      nextStep,
      status: newStatus,
    });
  } catch (error: any) {
    console.error('Approve/Reject API error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
