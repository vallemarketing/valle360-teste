import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client ID from user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('client_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.client_id) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get ad accounts for this client
    const { data: accounts, error } = await supabase
      .from('client_ad_accounts')
      .select('*')
      .eq('client_id', profile.client_id)
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (error) {
      console.error('Error fetching ad accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Fetch current metrics for each account
    const accountsWithMetrics = await Promise.all(
      (accounts || []).map(async (account) => {
        let metrics = account.cached_metrics;

        // If no cached metrics or cache is stale (> 1 hour), fetch fresh
        const cacheAge = account.metrics_updated_at
          ? Date.now() - new Date(account.metrics_updated_at).getTime()
          : Infinity;

        if (!metrics || cacheAge > 3600000) {
          metrics = await fetchAccountMetrics(account);
          
          // Update cache
          await supabase
            .from('client_ad_accounts')
            .update({
              cached_metrics: metrics,
              metrics_updated_at: new Date().toISOString(),
            })
            .eq('id', account.id);
        }

        return {
          id: account.id,
          platform: account.platform,
          account_id: account.account_id,
          account_name: account.account_name,
          connected_at: account.connected_at,
          is_active: account.is_active,
          metrics,
        };
      })
    );

    return NextResponse.json({ accounts: accountsWithMetrics });
  } catch (error: any) {
    console.error('Error in ad accounts API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fetch metrics from ad platform APIs
async function fetchAccountMetrics(account: any): Promise<{
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
} | null> {
  try {
    if (account.platform === 'meta') {
      return await fetchMetaAdsMetrics(account);
    } else if (account.platform === 'google') {
      return await fetchGoogleAdsMetrics(account);
    }
  } catch (error) {
    console.error(`Failed to fetch metrics for ${account.platform}:`, error);
  }
  return null;
}

// Fetch Meta Ads metrics
async function fetchMetaAdsMetrics(account: any) {
  const accessToken = account.access_token_encrypted; // In production, decrypt this
  
  if (!accessToken) return null;

  try {
    // Get last 30 days insights
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/act_${account.account_id}/insights?` +
      `fields=spend,impressions,clicks,actions&` +
      `time_range={"since":"${thirtyDaysAgo.toISOString().split('T')[0]}","until":"${today.toISOString().split('T')[0]}"}&` +
      `access_token=${accessToken}`
    );

    const data = await response.json();
    
    if (data.data && data.data[0]) {
      const insights = data.data[0];
      const conversions = insights.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0;
      
      return {
        spend: parseFloat(insights.spend || 0),
        impressions: parseInt(insights.impressions || 0),
        clicks: parseInt(insights.clicks || 0),
        conversions: parseInt(conversions),
      };
    }
  } catch (error) {
    console.error('Meta Ads API error:', error);
  }
  
  return null;
}

// Fetch Google Ads metrics
async function fetchGoogleAdsMetrics(account: any) {
  // Google Ads requires more complex setup with customer ID and developer token
  // This would need the Google Ads API client library
  // For now, return null (would be implemented with actual API)
  return null;
}
