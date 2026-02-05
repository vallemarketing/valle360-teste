import { NextRequest, NextResponse } from 'next/server';
import { leadScraper, type ScrapingConfig, type Lead } from '@/lib/ai/lead-scraper';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const industry = searchParams.get('industry') || undefined;
    const min_score = searchParams.get('min_score');
    const assigned_to = searchParams.get('assigned_to') || undefined;

    const leads = await leadScraper.getLeads({
      status,
      industry,
      min_score: min_score ? parseInt(min_score) : undefined,
      assigned_to
    });

    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar leads' },
      { status: 500 }
    );
  }
}

// POST - Criar lead ou executar scraping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Ação de scraping
    if (action === 'scrape') {
      const config: ScrapingConfig = {
        industry: data.industry,
        location: data.location,
        keywords: data.keywords,
        has_website: data.has_website,
        has_social_media: data.has_social_media
      };

      const result = await leadScraper.searchLeads(config);
      return NextResponse.json({ success: true, result });
    }

    // Ação de gerar mensagem
    if (action === 'generate_message') {
      const { lead, template } = data;
      const message = leadScraper.generateOutreachMessage(lead, template || 'initial');
      return NextResponse.json({ success: true, message });
    }

    // Criar lead manualmente
    const lead: Lead = {
      company_name: data.company_name,
      website: data.website,
      email: data.email,
      phone: data.phone,
      industry: data.industry,
      size: data.size,
      location: data.location,
      social_media: data.social_media,
      score: data.score || 50,
      status: data.status || 'new',
      source: data.source || 'manual',
      tags: data.tags,
      notes: data.notes
    };

    const savedLead = await leadScraper.saveLead(lead);
    
    if (!savedLead) {
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead: savedLead });
  } catch (error) {
    console.error('Erro na API de leads:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do lead é obrigatório' },
        { status: 400 }
      );
    }

    // Atualização de score por interação
    if (updates.interaction) {
      await leadScraper.updateLeadScore(id, updates.interaction);
      return NextResponse.json({ success: true, message: 'Score atualizado' });
    }

    // Atualização geral
    const { error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Lead atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar lead' },
      { status: 500 }
    );
  }
}

// DELETE - Remover lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do lead é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao remover lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Lead removido' });
  } catch (error) {
    console.error('Erro ao remover lead:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover lead' },
      { status: 500 }
    );
  }
}




