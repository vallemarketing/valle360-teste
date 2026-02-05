import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Get client branding configuration for white-label
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const clientId = params.clientId;

    // Get client branding
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name, brand_color, secondary_color, logo_url, settings')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      // Return default branding
      return NextResponse.json({
        success: true,
        branding: null,
      });
    }

    // Extract branding from client data
    const settings = client.settings || {};

    return NextResponse.json({
      success: true,
      branding: {
        primary_color: client.brand_color || settings.primary_color || '#1672d6',
        secondary_color: client.secondary_color || settings.secondary_color || '#001533',
        logo_url: client.logo_url || settings.logo_url,
        favicon_url: settings.favicon_url,
        company_name: client.name,
        accent_color: settings.accent_color,
      },
    });
  } catch (error: any) {
    console.error('Branding API error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * Update client branding (Super Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const clientId = params.clientId;

    // Verify user is authenticated and is super_admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const body = await request.json();

    // Update client branding
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        brand_color: body.primary_color,
        secondary_color: body.secondary_color,
        logo_url: body.logo_url,
        settings: {
          ...(await supabase.from('clients').select('settings').eq('id', clientId).single()).data?.settings,
          favicon_url: body.favicon_url,
          accent_color: body.accent_color,
        },
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating branding:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar branding' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Branding atualizado com sucesso',
    });
  } catch (error: any) {
    console.error('Branding POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
