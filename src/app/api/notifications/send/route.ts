import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { sendPushNotification, sendBulkPushNotifications, PushSubscription, PushNotificationPayload } from '@/lib/notifications/web-push';

export const dynamic = 'force-dynamic';

/**
 * POST - Send push notification to specific users or all subscribers
 * Admin/internal use only
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

    // Check if user is admin
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const role = (profile as any)?.role;
    if (!['super_admin', 'admin', 'gerente'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      user_ids, // Array of user IDs to notify, or empty for all
      notification, // PushNotificationPayload
    } = body;
    
    if (!notification || !notification.title || !notification.body) {
      return NextResponse.json(
        { success: false, error: 'notification.title and notification.body are required' },
        { status: 400 }
      );
    }

    // Fetch subscriptions
    let query = admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .eq('active', true);
    
    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      query = query.in('user_id', user_ids);
    }
    
    const { data: subscriptions, error: subError } = await query;
    
    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions found',
        sent: 0,
        failed: 0,
      });
    }

    // Convert to PushSubscription format
    const pushSubscriptions: PushSubscription[] = (subscriptions as any[]).map(sub => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    // Send notifications
    const result = await sendBulkPushNotifications(pushSubscriptions, notification as PushNotificationPayload);

    // Clean up expired subscriptions
    if (result.expired.length > 0) {
      await admin
        .from('push_subscriptions')
        .update({ active: false, updated_at: new Date().toISOString() })
        .in('endpoint', result.expired);
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired.length,
    });
  } catch (e: any) {
    console.error('Send push notification error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
