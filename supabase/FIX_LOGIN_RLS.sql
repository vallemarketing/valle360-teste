-- Fix RLS que atrapalha login/auditoria
-- Observação: rode este SQL no Supabase SQL Editor (ou via migrations) do seu projeto.

-- user_access_logs: permitir que o próprio usuário registre o login
ALTER TABLE IF EXISTS public.user_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own access logs" ON public.user_access_logs;
CREATE POLICY "Users can insert own access logs" ON public.user_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

