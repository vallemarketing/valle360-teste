export type ExecutiveRole = 'ceo' | 'cfo' | 'cmo' | 'cto' | 'coo' | 'cco' | 'chro';

export const EXECUTIVE_ROLES: ExecutiveRole[] = ['ceo', 'cfo', 'cmo', 'cto', 'coo', 'cco', 'chro'];

export function normalizeExecutiveRole(input: unknown): ExecutiveRole | null {
  const r = String(input || '')
    .trim()
    .toLowerCase();
  return (EXECUTIVE_ROLES as string[]).includes(r) ? (r as ExecutiveRole) : null;
}

