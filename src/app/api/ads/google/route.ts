import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const expectedKey = process.env.ADS_INTEGRATION_API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      client_id,
      period_start,
      period_end,
      roas,
      cpc,
      cpm,
      ctr,
      investment,
      conversions,
      leads,
      impressions,
      clicks,
      raw_data,
    } = body;

    if (!client_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, period_start, period_end' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('traffic_metrics')
      .insert({
        client_id,
        platform: 'google_ads',
        period_start,
        period_end,
        roas: roas || 0,
        cpc: cpc || 0,
        cpm: cpm || 0,
        ctr: ctr || 0,
        investment: investment || 0,
        conversions: conversions || 0,
        leads: leads || 0,
        impressions: impressions || 0,
        clicks: clicks || 0,
        raw_data: raw_data || {},
        import_source: 'api',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting Google Ads data:', error);
      return NextResponse.json(
        { error: 'Failed to insert metrics', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Google Ads metrics imported successfully',
        data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error processing Google Ads webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
