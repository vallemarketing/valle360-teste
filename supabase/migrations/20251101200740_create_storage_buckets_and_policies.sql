/*
  # Storage Buckets and Policies

  ## Overview
  This migration creates Supabase Storage buckets for profile photos, contracts,
  and client rules documents with appropriate security policies.

  ## Storage Buckets Created

  ### 1. `profile-photos`
  Stores user profile photo images.
  - Public access for viewing
  - Users can upload/update their own photos
  - Admins can manage all photos

  ### 2. `contracts`
  Stores client contract PDF documents.
  - Private access (authenticated users only)
  - Only admins can upload
  - Clients can view their own contracts

  ### 3. `client-rules`
  Stores client rules and policies PDF documents.
  - Private access (authenticated users only)
  - Only admins can upload
  - Clients can view their own rules documents

  ### 4. `client-documents`
  Stores client uploaded documents (RG, CNH, etc).
  - Private access (authenticated users only)
  - Clients can upload their own documents
  - Admins can view all documents

  ## Security
  - RLS policies ensure users can only access their own files
  - Admins have full access to manage all files
  - Public bucket only for profile photos
*/

-- Create profile-photos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Create contracts bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Create client-rules bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-rules',
  'client-rules',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Create client-documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents',
  'client-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

-- Storage policies for profile-photos bucket
CREATE POLICY "Users can view all profile photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own profile photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own profile photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can manage all profile photos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Storage policies for contracts bucket
CREATE POLICY "Users can view own contracts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    ))
  );

CREATE POLICY "Admins can upload contracts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update contracts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete contracts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Storage policies for client-rules bucket
CREATE POLICY "Users can view own rules documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-rules' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    ))
  );

CREATE POLICY "Admins can upload rules documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-rules' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update rules documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-rules' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete rules documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-rules' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Storage policies for client-documents bucket
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    ))
  );

CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can manage all client documents"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'client-documents' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );