import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Client Files API
 * Allows clients to view and upload files to their storage
 */
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

    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder') || '';
    const type = searchParams.get('type'); // 'deliverables', 'reports', 'contracts', etc.

    // Build the path
    const basePath = `clients/${profile.client_id}`;
    const path = folder ? `${basePath}/${folder}` : basePath;

    // List files from Supabase Storage
    const { data: files, error } = await supabase.storage
      .from('client-files')
      .list(path, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Error listing files:', error);
      // Try to create the folder if it doesn't exist
      if (error.message?.includes('not found')) {
        return NextResponse.json({ files: [], folders: [] });
      }
      return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }

    // Separate files and folders
    const folders = files?.filter(f => f.id === null) || [];
    const fileList = files?.filter(f => f.id !== null) || [];

    // Get signed URLs for files
    const filesWithUrls = await Promise.all(
      fileList.map(async (file) => {
        const { data: signedUrl } = await supabase.storage
          .from('client-files')
          .createSignedUrl(`${path}/${file.name}`, 3600); // 1 hour

        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          mimeType: file.metadata?.mimetype || 'application/octet-stream',
          createdAt: file.created_at,
          url: signedUrl?.signedUrl,
        };
      })
    );

    // Also fetch files from database for metadata
    const { data: dbFiles } = await supabase
      .from('client_files')
      .select('*')
      .eq('client_id', profile.client_id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      files: filesWithUrls,
      folders: folders.map(f => ({ name: f.name })),
      dbFiles: dbFiles || [],
      currentPath: path,
    });
  } catch (error: any) {
    console.error('Error in client files API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Build the path
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = `clients/${profile.client_id}/${folder}/${fileName}`;

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabase.storage
      .from('client-files')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get signed URL
    const { data: signedUrl } = await supabase.storage
      .from('client-files')
      .createSignedUrl(path, 3600);

    // Save metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('client_files')
      .insert({
        client_id: profile.client_id,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        folder,
        description,
        uploaded_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      // File uploaded but metadata failed - not critical
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord?.id,
        name: file.name,
        path,
        url: signedUrl?.signedUrl,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
