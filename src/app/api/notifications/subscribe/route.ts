import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { getPublicVapidKey } from '@/lib/notifications/web-push';

export const dynamic = 'force-dynamic';

/**
 * GET - Returns the public VAPID key for client-side subscription
 */
export async function GET(request: NextRequest) {
  const publicKey = getPublicVapidKey();
  
  if (!publicKey) {
    return NextResponse.json(
      { success: false, error: 'Push notifications not configured' },
      { status: 503 }
    );
  }
  
  return NextResponse.json({
    success: true,
    publicKey,
  });
}

/**
 * POST - Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    
    // Get user profile
    const { data: profile } = await admin
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const profileId = profile?.id ? String(profile.id) : null;
    
    // Check if subscription already exists
    const { data: existing } = await admin
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();
    
    if (existing) {
      // Update existing subscription
      await admin
        .from('push_subscriptions')
        .update({
          user_id: user.id,
          profile_id: profileId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updated_at: new Date().toISOString(),
          active: true,
        })
        .eq('id', existing.id);
    } else {
      // Create new subscription
      await admin
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Push subscription error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;
    
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    
    // Soft delete - mark as inactive
    await admin
      .from('push_subscriptions')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('endpoint', endpoint)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Push unsubscription error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
