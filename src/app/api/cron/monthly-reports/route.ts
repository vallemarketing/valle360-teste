import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateClientReport, emailReport } from '@/lib/reports/pdfGenerator';

// Use service role for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron: Generate Monthly Reports
 * Run: 1st of every month at 06:00 UTC
 * Vercel Cron: 0 6 1 * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const periodStart = lastMonth.toISOString().split('T')[0];
    const periodEnd = lastMonthEnd.toISOString().split('T')[0];

    console.log(`[CRON] Generating monthly reports for ${periodStart} to ${periodEnd}`);

    // Get all active clients with contracts
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select(`
        id,
        company_name,
        email,
        contact_name,
        client_white_label (
          primary_color,
          secondary_color,
          logo_url,
          company_name,
          report_footer
        )
      `)
      .eq('active', true);

    if (clientError || !clients) {
      console.error('Failed to fetch clients:', clientError);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    const results = {
      total: clients.length,
      generated: 0,
      emailed: 0,
      failed: 0,
    };

    for (const client of clients) {
      try {
        // Get metrics for this client
        const metrics = await getClientMetrics(client.id, periodStart, periodEnd);
        const topPosts = await getClientTopPosts(client.id, periodStart, periodEnd);
        const platformBreakdown = await getPlatformBreakdown(client.id, periodStart, periodEnd);

        // Generate report data
        const reportData = {
          clientName: client.company_name,
          clientLogo: client.client_white_label?.[0]?.logo_url,
          period: {
            start: periodStart,
            end: periodEnd,
          },
          metrics,
          topPosts,
          platformBreakdown,
        };

        // Get white label config
        const whiteLabelConfig = client.client_white_label?.[0] ? {
          primaryColor: client.client_white_label[0].primary_color || '#4F46E5',
          secondaryColor: client.client_white_label[0].secondary_color || '#6B7280',
          logoUrl: client.client_white_label[0].logo_url,
          companyName: client.client_white_label[0].company_name || 'Valle360',
          reportFooter: client.client_white_label[0].report_footer,
        } : undefined;

        // Generate PDF
        const pdfBlob = await generateClientReport(reportData, whiteLabelConfig);
        results.generated++;

        // Save to storage
        const fileName = `reports/${client.id}/${now.getFullYear()}/${String(now.getMonth()).padStart(2, '0')}/relatorio-${periodStart}.pdf`;
        const buffer = Buffer.from(await pdfBlob.arrayBuffer());
        
        await supabase.storage
          .from('client-files')
          .upload(fileName, buffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        // Save report record
        await supabase.from('client_reports').insert({
          client_id: client.id,
          type: 'monthly',
          period_start: periodStart,
          period_end: periodEnd,
          file_path: fileName,
          metrics: metrics,
          generated_at: new Date().toISOString(),
        });

        // Email to client
        if (client.email) {
          await emailReport(pdfBlob, client.email, client.company_name);
          results.emailed++;
        }

        // Create notification (best-effort)
        try {
          await supabase.from('notifications').insert({
            user_id: client.id, // Assuming client has a user
            type: 'report_generated',
            title: 'Relatório mensal disponível',
            message: `Seu relatório de ${lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} está pronto!`,
            link: '/cliente/relatorios',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } catch {
          // Ignore notification errors
        }

        console.log(`[REPORT] Generated for ${client.company_name}`);
      } catch (err) {
        console.error(`Failed to generate report for ${client.id}:`, err);
        results.failed++;
      }
    }

    // Log cron execution (best-effort)
    try {
      await supabase.from('cron_logs').insert({
        job_name: 'monthly_reports',
        run_at: new Date().toISOString(),
        status: results.failed === 0 ? 'success' : 'partial',
        result: results,
      });
    } catch {
      // Ignore logging errors
    }

    console.log('[CRON] Monthly reports complete:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('[CRON] Monthly reports error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}

// Get metrics for a client
async function getClientMetrics(clientId: string, startDate: string, endDate: string) {
  // Get posts data
  const { data: posts } = await supabase
    .from('social_posts')
    .select('*')
    .eq('client_id', clientId)
    .gte('published_at', startDate)
    .lte('published_at', endDate);

  const publishedPosts = posts?.filter(p => p.status === 'published') || [];
  const scheduledPosts = posts?.filter(p => p.status === 'scheduled') || [];

  // Calculate metrics
  const totalEngagement = publishedPosts.reduce((sum, p) => {
    return sum + (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0);
  }, 0);

  const totalReach = publishedPosts.reduce((sum, p) => sum + (p.metrics?.reach || 0), 0);
  const totalImpressions = publishedPosts.reduce((sum, p) => sum + (p.metrics?.impressions || 0), 0);

  const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

  return {
    totalPosts: posts?.length || 0,
    publishedPosts: publishedPosts.length,
    scheduledPosts: scheduledPosts.length,
    engagementRate: Math.round(engagementRate * 10) / 10,
    reach: totalReach,
    impressions: totalImpressions,
    likes: publishedPosts.reduce((sum, p) => sum + (p.metrics?.likes || 0), 0),
    comments: publishedPosts.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0),
    shares: publishedPosts.reduce((sum, p) => sum + (p.metrics?.shares || 0), 0),
    followers: 0, // Would need to track this separately
    followerGrowth: 0,
  };
}

// Get top posts for a client
async function getClientTopPosts(clientId: string, startDate: string, endDate: string) {
  const { data: posts } = await supabase
    .from('social_posts')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'published')
    .gte('published_at', startDate)
    .lte('published_at', endDate)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!posts) return [];

  // Sort by engagement
  const sorted = posts
    .map(p => ({
      id: p.id,
      caption: p.caption || p.content || '',
      platform: p.platform || 'instagram',
      engagement: ((p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0)) / 
        Math.max(p.metrics?.reach || 1, 1) * 100,
      reach: p.metrics?.reach || 0,
      publishedAt: p.published_at,
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  return sorted;
}

// Get platform breakdown
async function getPlatformBreakdown(clientId: string, startDate: string, endDate: string) {
  const { data: posts } = await supabase
    .from('social_posts')
    .select('platform, metrics, status')
    .eq('client_id', clientId)
    .eq('status', 'published')
    .gte('published_at', startDate)
    .lte('published_at', endDate);

  if (!posts) return {};

  const breakdown: Record<string, { posts: number; engagement: number; reach: number }> = {};

  for (const post of posts) {
    const platform = post.platform || 'instagram';
    if (!breakdown[platform]) {
      breakdown[platform] = { posts: 0, engagement: 0, reach: 0 };
    }

    breakdown[platform].posts++;
    breakdown[platform].reach += post.metrics?.reach || 0;
    
    const postEngagement = (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0);
    const postReach = post.metrics?.reach || 1;
    breakdown[platform].engagement += (postEngagement / postReach) * 100;
  }

  // Average the engagement rates
  for (const platform of Object.keys(breakdown)) {
    if (breakdown[platform].posts > 0) {
      breakdown[platform].engagement = Math.round(
        (breakdown[platform].engagement / breakdown[platform].posts) * 10
      ) / 10;
    }
  }

  return breakdown;
}
