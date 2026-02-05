import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO CRÍTICO: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas!');
}

// Evita crash na inicialização se as variáveis estiverem faltando
export const supabase = createClient(
  supabaseUrl || 'https://setup-missing.supabase.co',
  supabaseAnonKey || 'setup-missing',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export type UserRole = 'super_admin' | 'gestor' | 'colaborador' | 'cliente';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  avatar_url?: string;
}
