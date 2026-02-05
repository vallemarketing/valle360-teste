import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// GET - Obter configurações de branding
export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { data, error } = await supabase
      .from('company_branding')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    // Se não existir, criar configuração padrão
    if (!data) {
      const { data: newBranding, error: insertError } = await supabase
        .from('company_branding')
        .insert({
          company_name: 'Valle 360',
          primary_color: '#4370d1',
          secondary_color: '#6366f1'
        })
        .select()
        .single()

      if (insertError) throw insertError
      
      return NextResponse.json({
        success: true,
        branding: newBranding
      })
    }

    return NextResponse.json({
      success: true,
      branding: data
    })
  } catch (error: any) {
    console.error('Erro ao buscar branding:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar configurações de branding
export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const body = await request.json()
    const { companyName, logoUrl, iconUrl, faviconUrl, primaryColor, secondaryColor } = body

    // Buscar ID do branding existente
    const { data: existing } = await supabase
      .from('company_branding')
      .select('id')
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Configuração de branding não encontrada' },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}
    if (companyName !== undefined) updateData.company_name = companyName
    if (logoUrl !== undefined) updateData.logo_url = logoUrl
    if (iconUrl !== undefined) updateData.icon_url = iconUrl
    if (faviconUrl !== undefined) updateData.favicon_url = faviconUrl
    if (primaryColor !== undefined) updateData.primary_color = primaryColor
    if (secondaryColor !== undefined) updateData.secondary_color = secondaryColor

    const { data, error } = await supabase
      .from('company_branding')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      branding: data,
      message: 'Branding atualizado com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao atualizar branding:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}








