/**
 * Canva Connect API Integration
 * For editing designs directly in the app
 */

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || '';
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || '';
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || '';

export interface CanvaDesign {
  id: string;
  title: string;
  thumbnailUrl?: string;
  editUrl?: string;
  viewUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CanvaToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Get OAuth authorization URL for Canva
 */
export function getCanvaAuthUrl(clientId: string, userId: string): string {
  const stateData = {
    clientId,
    userId,
    timestamp: Date.now(),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

  const scopes = [
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'folder:read',
    'asset:read',
    'asset:write',
  ].join(' ');

  const url = new URL('https://www.canva.com/api/oauth/authorize');
  url.searchParams.set('client_id', CANVA_CLIENT_ID);
  url.searchParams.set('redirect_uri', CANVA_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('state', state);

  return url.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCanvaCode(code: string): Promise<CanvaToken> {
  const response = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CANVA_REDIRECT_URI,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(data.error_description || 'Failed to get Canva tokens');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh access token
 */
export async function refreshCanvaToken(refreshToken: string): Promise<CanvaToken> {
  const response = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(data.error_description || 'Failed to refresh Canva token');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * List user's designs
 */
export async function listCanvaDesigns(
  accessToken: string,
  limit: number = 20
): Promise<CanvaDesign[]> {
  const response = await fetch(
    `https://api.canva.com/rest/v1/designs?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to list Canva designs');
  }

  return (data.designs || []).map((d: any) => ({
    id: d.id,
    title: d.title,
    thumbnailUrl: d.thumbnail?.url,
    editUrl: d.urls?.edit_url,
    viewUrl: d.urls?.view_url,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

/**
 * Get design details
 */
export async function getCanvaDesign(
  accessToken: string,
  designId: string
): Promise<CanvaDesign> {
  const response = await fetch(
    `https://api.canva.com/rest/v1/designs/${designId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to get Canva design');
  }

  return {
    id: data.design.id,
    title: data.design.title,
    thumbnailUrl: data.design.thumbnail?.url,
    editUrl: data.design.urls?.edit_url,
    viewUrl: data.design.urls?.view_url,
    createdAt: data.design.created_at,
    updatedAt: data.design.updated_at,
  };
}

/**
 * Create a new design from template
 */
export async function createCanvaDesign(
  accessToken: string,
  title: string,
  designType: 'instagramPost' | 'facebookPost' | 'linkedinPost' | 'presentation' | 'poster' = 'instagramPost'
): Promise<CanvaDesign> {
  const designTypeMap: Record<string, string> = {
    instagramPost: 'TABQjK-JR7E',
    facebookPost: 'TACFvr0jR7E',
    linkedinPost: 'TACs_rR0JR7E',
    presentation: 'TABQWnz7nR7E',
    poster: 'TABQi4K7nR7E',
  };

  const response = await fetch('https://api.canva.com/rest/v1/designs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      design_type: { type: 'preset', preset: designTypeMap[designType] },
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to create Canva design');
  }

  return {
    id: data.design.id,
    title: data.design.title,
    editUrl: data.design.urls?.edit_url,
  };
}

/**
 * Export design to image
 */
export async function exportCanvaDesign(
  accessToken: string,
  designId: string,
  format: 'png' | 'jpg' | 'pdf' = 'png'
): Promise<string> {
  // Start export job
  const startResponse = await fetch(
    `https://api.canva.com/rest/v1/designs/${designId}/exports`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: { type: format === 'pdf' ? 'pdf' : 'png' },
      }),
    }
  );

  const startData = await startResponse.json();

  if (startData.error) {
    throw new Error(startData.error.message || 'Failed to start export');
  }

  const jobId = startData.job.id;

  // Poll for completion
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 1000));

    const statusResponse = await fetch(
      `https://api.canva.com/rest/v1/designs/${designId}/exports/${jobId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const statusData = await statusResponse.json();

    if (statusData.job.status === 'completed') {
      return statusData.job.urls[0]?.url || '';
    }

    if (statusData.job.status === 'failed') {
      throw new Error('Export failed');
    }

    attempts++;
  }

  throw new Error('Export timeout');
}

/**
 * Get the Canva Button embed URL
 */
export function getCanvaButtonUrl(options: {
  designId?: string;
  designType?: string;
  onDesignComplete?: string;
}): string {
  const url = new URL('https://www.canva.com/design');
  
  if (options.designId) {
    url.searchParams.set('designId', options.designId);
  }
  
  if (options.designType) {
    url.searchParams.set('type', options.designType);
  }

  return url.toString();
}
