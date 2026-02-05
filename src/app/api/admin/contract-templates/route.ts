import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/contract-templates
 * Lista todos os templates de contrato
 */
export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabase
      .from('contract_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, templates: templates || [] });
  } catch (error: any) {
    console.error('Error in GET /api/admin/contract-templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/contract-templates
 * Cria um novo template de contrato
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const body = await request.json();
    const { name, type, description, content, variables, is_active } = body;

    if (!name || !content) {
      return NextResponse.json(
        { success: false, error: 'Nome e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('contract_templates')
      .insert({
        name,
        type: type || 'standard',
        description: description || null,
        content,
        variables: variables || [],
        is_active: is_active !== false,
        created_by: gate.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error('Error in POST /api/admin/contract-templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/contract-templates
 * Atualiza um template existente
 */
export async function PUT(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const body = await request.json();
    const { id, name, type, description, content, variables, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (variables !== undefined) updateData.variables = variables;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: template, error } = await supabase
      .from('contract_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/contract-templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
