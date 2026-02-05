import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { createEvent, listEvents, scheduleMeeting, MeetingTemplates } from '@/lib/integrations/google-calendar';

export const dynamic = 'force-dynamic';

/**
 * GET - List calendar events
 */
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
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Get user's Google Calendar tokens
    const { data: tokens } = await admin
      .from('user_oauth_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google_calendar')
      .maybeSingle();
    
    if (!tokens?.access_token) {
      // Return local events only if no Google Calendar connected
      const { data: localEvents } = await admin
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate || new Date().toISOString())
        .order('start_time', { ascending: true });

      return NextResponse.json({
        success: true,
        events: localEvents || [],
        source: 'local',
      });
    }

    // Fetch from Google Calendar
    const result = await listEvents(
      tokens.access_token,
      tokens.refresh_token,
      {
        timeMin: startDate ? new Date(startDate) : undefined,
        timeMax: endDate ? new Date(endDate) : undefined,
        maxResults: 100,
      }
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      events: result.events,
      source: 'google',
    });
  } catch (e: any) {
    console.error('Calendar events GET error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a calendar event
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

    const admin = getSupabaseAdmin();
    const body = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
      duration_minutes,
      attendees,
      create_meet_link,
      template,
      client_id,
      client_name,
      location,
    } = body;

    if (!title || !start_time) {
      return NextResponse.json(
        { success: false, error: 'title e start_time são obrigatórios' },
        { status: 400 }
      );
    }

    // Get user's Google Calendar tokens
    const { data: tokens } = await admin
      .from('user_oauth_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google_calendar')
      .maybeSingle();

    let googleEvent: any = null;

    if (tokens?.access_token) {
      // Create in Google Calendar
      let eventData: any;
      
      if (template && MeetingTemplates[template as keyof typeof MeetingTemplates]) {
        const templateFn = MeetingTemplates[template as keyof typeof MeetingTemplates];
        if (template === 'approval') {
          eventData = templateFn(client_name || 'Cliente', description || '', attendees || []);
        } else {
          eventData = (templateFn as any)(client_name || 'Cliente', attendees || []);
        }
        eventData.start = new Date(start_time);
        eventData.end = end_time ? new Date(end_time) : new Date(new Date(start_time).getTime() + (duration_minutes || 60) * 60000);
      } else {
        const startDate = new Date(start_time);
        const endDate = end_time 
          ? new Date(end_time) 
          : new Date(startDate.getTime() + (duration_minutes || 60) * 60000);

        eventData = {
          summary: title,
          description,
          location,
          start: startDate,
          end: endDate,
          attendees,
          conferenceData: create_meet_link !== false,
          reminders: { email: 60, popup: 15 },
        };
      }

      const result = await createEvent(
        tokens.access_token,
        tokens.refresh_token,
        eventData
      );

      if (result.success) {
        googleEvent = result;
      } else {
        console.error('Google Calendar error:', result.error);
      }
    }

    // Save to local database
    const { data: localEvent, error: localError } = await admin
      .from('calendar_events')
      .insert({
        user_id: user.id,
        client_id,
        title,
        description,
        location,
        start_time,
        end_time: end_time || new Date(new Date(start_time).getTime() + (duration_minutes || 60) * 60000).toISOString(),
        attendees: attendees || [],
        meet_link: googleEvent?.meetLink,
        google_event_id: googleEvent?.eventId,
        google_event_link: googleEvent?.htmlLink,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (localError) {
      console.error('Local event save error:', localError);
    }

    // Send notifications to attendees
    if (attendees && attendees.length > 0) {
      // TODO: Send email/WhatsApp notifications
    }

    return NextResponse.json({
      success: true,
      event: localEvent,
      google_event: googleEvent,
    });
  } catch (e: any) {
    console.error('Calendar events POST error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
