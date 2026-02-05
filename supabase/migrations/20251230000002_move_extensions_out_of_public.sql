-- Valle 360 - Security hardening (advisors)
-- Move extensions out of `public` schema to reduce surface area.

create schema if not exists extensions;

-- These were flagged by Supabase security advisors as installed in `public`.
alter extension pg_trgm set schema extensions;
alter extension btree_gist set schema extensions;


