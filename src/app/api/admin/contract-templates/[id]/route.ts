import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/contract-templates/[id]
 * Busca um template específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const { id } = params;

    const { data: template, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { success: false, error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error('Error in GET /api/admin/contract-templates/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/contract-templates/[id]
 * Exclui um template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const { id } = params;

    const { error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Template excluído com sucesso' });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/contract-templates/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
