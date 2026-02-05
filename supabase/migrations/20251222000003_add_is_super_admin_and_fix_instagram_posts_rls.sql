-- Garantir função is_super_admin() para controles finos (Admin comum != Super Admin)
-- e ajustar RLS da tabela instagram_posts para permitir acesso total apenas ao Super Admin,
-- além dos colaboradores Social/Head.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND ((up.user_type)::text = 'super_admin' OR (up.role)::text = 'super_admin')
    )
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND ((u.user_type)::text = 'super_admin' OR (u.role)::text = 'super_admin')
    );
$$;

-- Atualizar políticas
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instagram_posts_admin_all ON public.instagram_posts;
DROP POLICY IF EXISTS instagram_posts_super_admin_all ON public.instagram_posts;

CREATE POLICY instagram_posts_super_admin_all
  ON public.instagram_posts
  FOR ALL
  TO public
  USING (is_super_admin())
  WITH CHECK (is_super_admin());



