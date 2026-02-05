/*
  # Social Media Uploads Bucket

  Cria um bucket público para armazenar mídias (imagem/vídeo) usadas em postagens
  (InstagramBack/Meta). O bucket é público para que as plataformas consigam baixar
  a mídia via URL; upload fica restrito a usuários autenticados.
*/

-- Bucket público para mídia de postagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-media',
  'social-media',
  true,
  104857600, -- 100MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600;

-- Leitura pública (as plataformas precisam acessar a URL)
CREATE POLICY "Public can view social media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'social-media');

-- Upload apenas por usuários autenticados, restrito à pasta do próprio usuário (auth.uid)
CREATE POLICY "Users can upload own social media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'social-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own social media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'social-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own social media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'social-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins podem gerenciar tudo (para suporte)
CREATE POLICY "Admins can manage all social media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'social-media' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'super_admin')
    )
  );



