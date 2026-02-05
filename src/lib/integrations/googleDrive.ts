/**
 * Google Drive Integration
 * For fetching and saving assets from client's Drive folders
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

/**
 * Get OAuth authorization URL for Google Drive
 */
export function getGoogleAuthUrl(clientId: string, userId: string): string {
  const stateData = {
    clientId,
    userId,
    timestamp: Date.now(),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file',
  ].join(' ');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);

  return url.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(data.error_description || 'Failed to get Google tokens');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh access token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(data.error_description || 'Failed to refresh Google token');
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * List files in a folder
 */
export async function listDriveFiles(
  accessToken: string,
  folderId?: string,
  mimeTypeFilter?: string
): Promise<DriveFile[]> {
  let query = 'trashed = false';
  
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }
  
  if (mimeTypeFilter) {
    query += ` and mimeType contains '${mimeTypeFilter}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('fields', 'files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,createdTime,modifiedTime)');
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to list Drive files');
  }

  return data.files || [];
}

/**
 * List folders
 */
export async function listDriveFolders(
  accessToken: string,
  parentId?: string
): Promise<DriveFolder[]> {
  let query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '50');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to list Drive folders');
  }

  return data.files || [];
}

/**
 * Get file download URL
 */
export async function getDriveFileUrl(
  accessToken: string,
  fileId: string
): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to get file URL');
  }

  return data.webContentLink;
}

/**
 * Upload file to Drive
 */
export async function uploadToDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  content: Buffer | Blob,
  folderId?: string
): Promise<DriveFile> {
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
  };

  const boundary = 'foo_bar_baz';
  
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  let fileBlob: Blob;
  if (content instanceof Blob) {
    fileBlob = content;
  } else {
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(content);
    fileBlob = new Blob([uint8Array], { type: mimeType });
  }
  formData.append('file', fileBlob);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to upload to Drive');
  }

  return data;
}
