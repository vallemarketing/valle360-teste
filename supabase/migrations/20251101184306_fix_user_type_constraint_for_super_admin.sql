-- Corrigir constraint de user_type para permitir super_admin

-- Dropar constraint antigo
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;

-- Criar novo constraint incluindo super_admin
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['client'::text, 'collaborator'::text, 'admin'::text]));

-- Atualizar função de handle_new_user para mapear corretamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type text;
BEGIN
  -- Mapear role para user_type correto
  v_user_type := CASE 
    WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'cliente') = 'super_admin' THEN 'admin'
    WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'cliente') = 'colaborador' THEN 'collaborator'
    ELSE 'client'
  END;

  INSERT INTO public.user_profiles (id, email, full_name, role, user_type, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    v_user_type,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    role = COALESCE(EXCLUDED.role, user_profiles.role),
    user_type = EXCLUDED.user_type,
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;