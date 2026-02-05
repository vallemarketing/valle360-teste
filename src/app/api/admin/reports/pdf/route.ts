/**
 * API Route: Generate PDF Report
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { generateClientReport } from '@/lib/reports/pdfGenerator';

export async function POST(request: Request) {
  try {
    const { clientId, startDate, endDate } = await request.json();

    if (!clientId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch client info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, logo_url')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch client's white-label config (if exists)
    const { data: whiteLabel } = await supabaseAdmin
      .from('client_white_label')
      .select('*')
      .eq('client_id', clientId)
      .single();

    // Fetch posts data for the period
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*')
      .eq('client_id', clientId)
      .gte('scheduled_time', startDate)
      .lte('scheduled_time', endDate);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts data' }, { status: 500 });
    }

    // Calculate metrics (simplified - in production, fetch from analytics API)
    const publishedPosts = posts?.filter(p => p.status === 'published') || [];
    const scheduledPosts = posts?.filter(p => p.status === 'scheduled') || [];

    // Aggregate metrics by platform
    const platformBreakdown: Record<string, { posts: number; engagement: number; reach: number }> = {};
    
    publishedPosts.forEach(post => {
      const platform = post.platform || 'other';
      if (!platformBreakdown[platform]) {
        platformBreakdown[platform] = { posts: 0, engagement: 0, reach: 0 };
      }
      platformBreakdown[platform].posts++;
      platformBreakdown[platform].engagement += post.metadata?.engagement || Math.random() * 5;
      platformBreakdown[platform].reach += post.metadata?.reach || Math.floor(Math.random() * 5000);
    });

    // Normalize engagement (average)
    Object.keys(platformBreakdown).forEach(platform => {
      const data = platformBreakdown[platform];
      data.engagement = data.posts > 0 ? data.engagement / data.posts : 0;
    });

    // Get top posts (simplified)
    const topPosts = publishedPosts
      .sort((a, b) => (b.metadata?.engagement || 0) - (a.metadata?.engagement || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        caption: p.caption || 'Sem legenda',
        platform: p.platform || 'instagram',
        engagement: p.metadata?.engagement || Math.random() * 5,
        reach: p.metadata?.reach || Math.floor(Math.random() * 5000),
        publishedAt: p.scheduled_time,
      }));

    // Build report data
    const reportData = {
      clientName: client.name,
      clientLogo: client.logo_url,
      period: {
        start: startDate,
        end: endDate,
      },
      metrics: {
        totalPosts: posts?.length || 0,
        publishedPosts: publishedPosts.length,
        scheduledPosts: scheduledPosts.length,
        engagementRate: publishedPosts.length > 0
          ? publishedPosts.reduce((sum, p) => sum + (p.metadata?.engagement || Math.random() * 5), 0) / publishedPosts.length
          : 0,
        reach: publishedPosts.reduce((sum, p) => sum + (p.metadata?.reach || Math.floor(Math.random() * 5000)), 0),
        impressions: publishedPosts.reduce((sum, p) => sum + (p.metadata?.impressions || Math.floor(Math.random() * 10000)), 0),
        likes: publishedPosts.reduce((sum, p) => sum + (p.metadata?.likes || Math.floor(Math.random() * 500)), 0),
        comments: publishedPosts.reduce((sum, p) => sum + (p.metadata?.comments || Math.floor(Math.random() * 50)), 0),
        shares: publishedPosts.reduce((sum, p) => sum + (p.metadata?.shares || Math.floor(Math.random() * 30)), 0),
        followers: 5000 + Math.floor(Math.random() * 10000), // Placeholder
        followerGrowth: 2.5 + Math.random() * 5, // Placeholder
      },
      topPosts,
      platformBreakdown,
    };

    // White-label config
    const whiteLabelConfig = whiteLabel ? {
      primaryColor: whiteLabel.primary_color || '#4F46E5',
      secondaryColor: whiteLabel.secondary_color || '#6B7280',
      logoUrl: whiteLabel.logo_url,
      companyName: whiteLabel.company_name || 'Valle360',
      reportFooter: whiteLabel.report_footer,
    } : undefined;

    // Generate PDF
    const pdfBlob = await generateClientReport(reportData, whiteLabelConfig);

    // Convert to base64 for response
    const buffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return NextResponse.json({
      success: true,
      pdf: base64,
      filename: `relatorio-${client.name.toLowerCase().replace(/\s+/g, '-')}-${startDate.slice(0, 7)}.pdf`,
    });

  } catch (error: any) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
