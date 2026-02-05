/**
 * Valle 360 - API de Prospecção
 * Endpoints para captação e gestão de leads
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { leadScraper } from '@/lib/ai/lead-scraper';
import { sendN8nOutboundEvent } from '@/lib/integrations/n8n/outbound';

export const dynamic = 'force-dynamic';

function isMissingTableError(message: string) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('relation') ||
    m.includes('schema cache') ||
    m.includes('could not find the table')
  );
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');
    const status = searchParams.get('status');
    const minScore = searchParams.get('min_score');

    let query = admin.from('prospecting_leads').select('*');

    if (segment) {
      query = query.eq('segment', segment);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (minScore) {
      query = query.gte('qualification_score', parseInt(minScore));
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (isMissingTableError(error?.message || '')) {
      return NextResponse.json({
        success: true,
        data: [],
        note: 'Tabela prospecting_leads ainda não existe no banco deste ambiente.',
      });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const admin = getSupabaseAdmin();
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'search': {
        // Prospecção real via Tavily (sem mock)
        const segment = String(params.segment || '').trim();
        const location = params.location ? String(params.location).trim() : undefined;
        const limit = Math.max(1, Math.min(20, Number(params.limit || 10)));
        const keywords = Array.isArray(params.keywords)
          ? params.keywords.map((x: any) => String(x).trim()).filter(Boolean)
          : typeof params.keywords === 'string'
            ? String(params.keywords)
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
            : undefined;

        if (!segment) {
          return NextResponse.json({ success: false, error: 'segment é obrigatório' }, { status: 400 });
        }

        // Buscar leads
        const scraped = await leadScraper.searchLeads({
          industry: segment,
          location,
          keywords,
          has_website: true,
        });

        if (!scraped.success) {
          return NextResponse.json(
            { success: false, error: 'Prospecção não configurada (verifique TAVILY_API_KEY e provedor de IA).' },
            { status: 501 }
          );
        }

        const leads = (scraped.leads || []).slice(0, limit);
        const inserted: any[] = [];
        let created = 0;
        let updated = 0;
        let missingWebsite = 0;

        for (const l of leads) {
          const website = l.website ? String(l.website).trim() : null;
          const companyName = String(l.company_name || '').trim();
          if (!companyName) continue;
          if (!website) missingWebsite += 1;

          // Dedup simples por website (quando existir)
          let existingId: string | null = null;
          if (website) {
            const { data: ex } = await admin
              .from('prospecting_leads')
              .select('id')
              .eq('company_website', website)
              .maybeSingle();
            if (ex?.id) existingId = String(ex.id);
          }

          const row: any = {
            company_name: companyName,
            company_website: website,
            company_industry: l.industry || segment,
            company_size: l.size || null,
            company_location: l.location ? { raw: l.location } : null,
            contact_email: l.email || null,
            contact_phone: l.phone || null,
            source: 'tavily',
            source_details: { source: scraped.source, query_segment: segment, query_location: location || null, keywords: keywords || [] },
            segment,
            qualification_score: Number.isFinite(l.score as any) ? Math.max(0, Math.min(100, Number(l.score))) : 0,
            qualification_factors: [],
            status: 'new',
            tags: l.tags || [],
            notes: l.notes || null,
            estimated_services: l.ai_insights?.potential_services || [],
            updated_at: new Date().toISOString(),
          };

          if (existingId) {
            const { data: up, error: upErr } = await admin
              .from('prospecting_leads')
              .update(row)
              .eq('id', existingId)
              .select()
              .single();
            if (!upErr && up) {
              updated += 1;
              inserted.push(up);
            }
          } else {
            const { data: ins, error: insErr } = await admin.from('prospecting_leads').insert(row).select().single();
            if (!insErr && ins) {
              created += 1;
              inserted.push(ins);
            }
          }
        }

        // Best-effort: disparar evento N8N/CRM (não bloqueia a resposta)
        void sendN8nOutboundEvent({
          event: 'prospecting.leads.upserted',
          actorUserId: gate.userId,
          data: {
            segment,
            location: location || null,
            keywords: keywords || [],
            found: leads.length,
            created,
            updated,
            leads: inserted.slice(0, 20).map((x: any) => ({
              id: String(x?.id || ''),
              company_name: String(x?.company_name || ''),
              company_website: x?.company_website ? String(x.company_website) : null,
              contact_email: x?.contact_email ? String(x.contact_email) : null,
              contact_phone: x?.contact_phone ? String(x.contact_phone) : null,
              qualification_score: Number(x?.qualification_score || 0),
              status: String(x?.status || 'new'),
              source: String(x?.source || 'tavily'),
            })),
          },
        });

        return NextResponse.json({
          success: true,
          created,
          updated,
          found: leads.length,
          data: inserted,
          note: missingWebsite > 0 ? 'Leads sem website não são deduplicados automaticamente.' : undefined,
        });
      }

      case 'contact': {
        // Iniciar contato com lead
        const { lead_id } = params;

        if (!lead_id) {
          return NextResponse.json({ success: false, error: 'lead_id é obrigatório' }, { status: 400 });
        }

        const { error } = await admin
          .from('prospecting_leads')
          .update({
            status: 'contacted',
            last_interaction_at: new Date().toISOString(),
          })
          .eq('id', lead_id);

        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

        // Best-effort: disparar evento N8N/CRM
        void sendN8nOutboundEvent({
          event: 'prospecting.lead.contacted',
          actorUserId: gate.userId,
          data: { lead_id: String(lead_id) },
        });

        return NextResponse.json({ success: true, message: 'Contato iniciado' });
      }

      case 'create': {
        // Criar lead manual
        const { data, error } = await admin
          .from('prospecting_leads')
          .insert(params)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Best-effort: disparar evento N8N/CRM
        void sendN8nOutboundEvent({
          event: 'prospecting.lead.created',
          actorUserId: gate.userId,
          data: {
            lead_id: String((data as any)?.id || ''),
            company_name: String((data as any)?.company_name || ''),
            company_website: (data as any)?.company_website ? String((data as any).company_website) : null,
            qualification_score: Number((data as any)?.qualification_score || 0),
            status: String((data as any)?.status || 'new'),
          },
        });

        return NextResponse.json({ success: true, data });
      }

      default:
        return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const admin = getSupabaseAdmin();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400 });

    const { data, error } = await admin
      .from('prospecting_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Best-effort: disparar evento N8N/CRM
    void sendN8nOutboundEvent({
      event: 'prospecting.lead.updated',
      actorUserId: gate.userId,
      data: {
        lead_id: String((data as any)?.id || id),
        status: (data as any)?.status ? String((data as any).status) : undefined,
        qualification_score: (data as any)?.qualification_score != null ? Number((data as any).qualification_score) : undefined,
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
