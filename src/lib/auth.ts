import { supabase } from './supabase';

export type UserRole = 'super_admin' | 'colaborador' | 'employee' | 'cliente';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function signUp(email: string, password: string, name: string, role: UserRole, phone?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        phone
      }
    }
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Tentar buscar role do user_profiles primeiro
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('full_name, role, user_type')
    .eq('user_id', user.id)
    .single();

  if (profileData) {
    // Normalizar 'employee' para 'colaborador' para compatibilidade
    let role = (profileData.user_type || profileData.role) as UserRole;
    if (role === 'employee') {
      role = 'colaborador';
    }
    // Segurança: nunca “promover” para super_admin por ausência de role.
    // Se não houver role definido, caímos no mais restrito.
    if (!role) role = 'cliente';
    const userData = {
      id: user.id,
      email: user.email!,
      name: profileData.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      role
    };
    return userData;
  }

  // Fallback: tentar buscar da tabela users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('full_name, role, user_type')
    .eq('id', user.id)
    .single();

  if (userData) {
    // Normalizar 'employee' para 'colaborador' para compatibilidade
    let role = (userData.user_type || userData.role) as UserRole;
    if (role === 'employee') {
      role = 'colaborador';
    }
    if (!role) role = 'cliente';
    const finalUserData = {
      id: user.id,
      email: user.email!,
      name: userData.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      role
    };
    return finalUserData;
  }

  // Último fallback: usar metadata (nunca “promover” por e-mail)
  const fallbackData = {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name || user.email?.split('@')[0] || '',
    role: (user.user_metadata?.role as UserRole) || 'cliente'
  };
  return fallbackData;
}

export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/admin/dashboard';
    case 'colaborador':
    case 'employee':  // Mapear employee para mesma rota de colaborador
      return '/colaborador/dashboard';
    case 'cliente':
      return '/cliente/dashboard';
    default:
      return '/cliente/dashboard';
  }
}

export async function verifyUserRole(allowedRoles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function getRoleFromPath(path: string): UserRole | null {
  if (path.startsWith('/admin')) return 'super_admin';
  if (path.startsWith('/app')) return 'colaborador';
  if (path.startsWith('/cliente')) return 'cliente';
  return null;
}
