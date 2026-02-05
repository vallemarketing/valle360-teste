-- =====================================================
-- MIGRATION: Super Admin read access (Mensagens)
-- Objetivo: permitir que o Super Admin acompanhe conversas/grupos
-- sem precisar ser participante, mantendo INSERT/UPDATE restritos.
-- =====================================================

-- message_groups
alter table if exists public.message_groups enable row level security;
drop policy if exists message_groups_admin_select on public.message_groups;
create policy message_groups_admin_select
on public.message_groups
for select
to authenticated
using ((select public.is_admin()));

-- group_participants
alter table if exists public.group_participants enable row level security;
drop policy if exists group_participants_admin_select on public.group_participants;
create policy group_participants_admin_select
on public.group_participants
for select
to authenticated
using ((select public.is_admin()));

-- direct_conversations
alter table if exists public.direct_conversations enable row level security;
drop policy if exists direct_conversations_admin_select on public.direct_conversations;
create policy direct_conversations_admin_select
on public.direct_conversations
for select
to authenticated
using ((select public.is_admin()));

-- direct_conversation_participants
alter table if exists public.direct_conversation_participants enable row level security;
drop policy if exists direct_conversation_participants_admin_select on public.direct_conversation_participants;
create policy direct_conversation_participants_admin_select
on public.direct_conversation_participants
for select
to authenticated
using ((select public.is_admin()));

-- direct_messages
alter table if exists public.direct_messages enable row level security;
drop policy if exists direct_messages_admin_select on public.direct_messages;
create policy direct_messages_admin_select
on public.direct_messages
for select
to authenticated
using ((select public.is_admin()));

-- messages (grupos)
alter table if exists public.messages enable row level security;
drop policy if exists group_messages_admin_select on public.messages;
create policy group_messages_admin_select
on public.messages
for select
to authenticated
using ((select public.is_admin()));

-- message_attachments
alter table if exists public.message_attachments enable row level security;
drop policy if exists message_attachments_admin_select on public.message_attachments;
create policy message_attachments_admin_select
on public.message_attachments
for select
to authenticated
using ((select public.is_admin()));




