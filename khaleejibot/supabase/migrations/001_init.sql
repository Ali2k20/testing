-- =============================================================================
-- KhaleejiBot — initial schema
--
-- Multi-tenant model: every row is reachable from exactly one organization.
--   organizations ─┬─ organization_members (auth.users ↔ org, with a role)
--                  └─ bots ─┬─ knowledge_chunks (pgvector RAG store)
--                           └─ conversations ── messages
--
-- Access rules
--   * Dashboard users (role `authenticated`) only ever see rows belonging to
--     organizations they are a member of. Every table has RLS enabled.
--   * Inbound channel traffic (web widget, WhatsApp webhook) is processed
--     server-side with the `service_role` key, which bypasses RLS. Customers
--     never talk to the database directly.
--   * `anon` gets no table access at all.
-- =============================================================================

create extension if not exists vector with schema extensions;

-- -----------------------------------------------------------------------------
-- Enumerations
-- -----------------------------------------------------------------------------
create type public.plan_tier as enum ('starter', 'growth', 'enterprise');
create type public.member_role as enum ('owner', 'admin', 'agent');
create type public.dialect_persona as enum ('emirati_khaleeji', 'levantine', 'msa_formal', 'bilingual_auto');
create type public.channel_type as enum ('web_widget', 'whatsapp');
create type public.conversation_status as enum ('AI_ACTIVE', 'HUMAN_PENDING', 'HUMAN_ACTIVE', 'RESOLVED');
create type public.sender_type as enum ('customer', 'ai', 'human_agent');
create type public.input_type as enum ('text', 'voice_note');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.organizations (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null check (char_length(name) between 1 and 120),
  plan_tier                 public.plan_tier not null default 'starter',
  whatsapp_phone_number_id  text unique,
  -- Encrypted by the application (AES-256-GCM, see src/lib/crypto.ts) before
  -- it is written. Never selectable by dashboard users (see column grants).
  whatsapp_access_token     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.organization_members (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.member_role not null default 'agent',
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index organization_members_user_idx on public.organization_members (user_id);

create table public.bots (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references public.organizations (id) on delete cascade,
  name                  text not null check (char_length(name) between 1 and 80),
  dialect_persona       public.dialect_persona not null default 'emirati_khaleeji',
  system_instructions   text not null default '' check (char_length(system_instructions) <= 8000),
  confidence_threshold  numeric(3, 2) not null default 0.75
                        check (confidence_threshold >= 0 and confidence_threshold <= 1),
  handoff_message_ar    text not null default 'لحظات من فضلك، بحوّلك الحين لواحد من فريقنا يساعدك 🙏',
  handoff_message_en    text not null default 'One moment please — I''m connecting you with a member of our team.',
  welcome_message_ar    text not null default 'هلا والله! كيف أقدر أساعدك اليوم؟',
  welcome_message_en    text not null default 'Hi there! How can I help you today?',
  -- When set, inbound WhatsApp messages to the org's number are answered by this bot.
  is_whatsapp_default   boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index bots_org_idx on public.bots (org_id);
-- At most one WhatsApp bot per organization.
create unique index bots_one_whatsapp_default_per_org
  on public.bots (org_id) where is_whatsapp_default;

create table public.knowledge_chunks (
  id           uuid primary key default gen_random_uuid(),
  bot_id       uuid not null references public.bots (id) on delete cascade,
  source_name  text not null check (char_length(source_name) between 1 and 200),
  content      text not null check (char_length(content) between 1 and 8000),
  embedding    extensions.vector(1536) not null,
  created_at   timestamptz not null default now()
);
create index knowledge_chunks_bot_idx on public.knowledge_chunks (bot_id, source_name);
create index knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

create table public.conversations (
  id                   uuid primary key default gen_random_uuid(),
  bot_id               uuid not null references public.bots (id) on delete cascade,
  channel              public.channel_type not null,
  -- WhatsApp: the customer's wa_id (E.164 without '+'). Web widget: an
  -- unguessable visitor id generated in the browser.
  customer_identifier  text not null check (char_length(customer_identifier) between 1 and 128),
  customer_name        text check (char_length(customer_name) <= 120),
  status               public.conversation_status not null default 'AI_ACTIVE',
  handoff_reason       text,
  ai_summary           text,
  assigned_agent_id    uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index conversations_bot_status_idx on public.conversations (bot_id, status, updated_at desc);
-- A customer has at most one open conversation per bot and channel; resolved
-- conversations are kept as history and a fresh one is opened next time.
create unique index conversations_one_open_per_customer
  on public.conversations (bot_id, channel, customer_identifier)
  where status <> 'RESOLVED';

create table public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations (id) on delete cascade,
  sender_type       public.sender_type not null,
  input_type        public.input_type not null default 'text',
  content_text      text not null default '' check (char_length(content_text) <= 8000),
  -- Storage object path inside the private `voice-notes` bucket.
  audio_url         text,
  confidence_score  numeric(4, 3) check (confidence_score >= 0 and confidence_score <= 1),
  -- Provider message id (e.g. WhatsApp wamid) — makes webhook retries idempotent.
  external_id       text unique,
  sender_user_id    uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  constraint voice_notes_have_audio check (input_type = 'text' or audio_url is not null)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- Per-source summary of a bot's knowledge for the dashboard. security_invoker
-- makes the view apply the caller's RLS on knowledge_chunks.
create view public.knowledge_sources
with (security_invoker = true) as
  select bot_id, source_name, count(*)::int as chunk_count, max(created_at) as updated_at
  from public.knowledge_chunks
  group by bot_id, source_name;

-- -----------------------------------------------------------------------------
-- Housekeeping triggers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger bots_updated_at before update on public.bots
  for each row execute function public.set_updated_at();
create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

-- Every new message bumps its conversation so the inbox sorts by activity.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- -----------------------------------------------------------------------------
-- Authorization helpers
--
-- SECURITY DEFINER so policies can consult organization_members without
-- recursing into its own RLS policy. All of them key off auth.uid().
-- -----------------------------------------------------------------------------
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function public.can_access_bot(p_bot_id uuid, p_admin_only boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bots b
    join public.organization_members m on m.org_id = b.org_id
    where b.id = p_bot_id
      and m.user_id = (select auth.uid())
      and (not p_admin_only or m.role in ('owner', 'admin'))
  );
$$;

create or replace function public.can_access_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    join public.bots b on b.id = c.bot_id
    join public.organization_members m on m.org_id = b.org_id
    where c.id = p_conversation_id
      and m.user_id = (select auth.uid())
  );
$$;

-- Creates an organization and makes the caller its owner, atomically. This is
-- the only way an organization comes into existence from the dashboard.
create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org  uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into public.organizations (name) values (trim(p_name)) returning id into v_org;
  insert into public.organization_members (org_id, user_id, role) values (v_org, v_user, 'owner');
  return v_org;
end;
$$;

-- -----------------------------------------------------------------------------
-- RAG: similarity search over a single bot's knowledge
--
-- SECURITY INVOKER: from the dashboard (playground) RLS restricts it to bots
-- the user can see; the server-side engine calls it with the service role.
-- -----------------------------------------------------------------------------
create or replace function public.match_knowledge_chunks(
  query_embedding  extensions.vector(1536),
  filter_bot_id    uuid,
  match_count      int default 5,
  match_threshold  float default 0.2
)
returns table (
  id           uuid,
  source_name  text,
  content      text,
  similarity   float
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    kc.id,
    kc.source_name,
    kc.content,
    1 - (kc.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.bot_id = filter_bot_id
    and 1 - (kc.embedding operator(extensions.<=>) query_embedding) >= match_threshold
  order by kc.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

-- With a filter on bot_id, an HNSW scan can return fewer than match_count rows
-- once other tenants' vectors crowd the candidate list. pgvector >= 0.8 can
-- keep scanning until enough rows pass the filter; enable that where available.
do $$
begin
  if (select string_to_array(extversion, '.')::int[] >= array[0, 8]
      from pg_extension where extname = 'vector') then
    alter function public.match_knowledge_chunks(extensions.vector, uuid, int, float)
      set hnsw.iterative_scan = 'relaxed_order';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row-Level Security
-- -----------------------------------------------------------------------------
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.bots                 enable row level security;
alter table public.knowledge_chunks     enable row level security;
alter table public.conversations        enable row level security;
alter table public.messages             enable row level security;

-- organizations ---------------------------------------------------------------
create policy "members read their organizations"
  on public.organizations for select to authenticated
  using (public.is_org_member(id));

create policy "admins update their organizations"
  on public.organizations for update to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

-- organization_members ---------------------------------------------------------
create policy "members see co-members"
  on public.organization_members for select to authenticated
  using (public.is_org_member(org_id));

create policy "admins add members"
  on public.organization_members for insert to authenticated
  with check (public.is_org_admin(org_id) and role <> 'owner');

create policy "admins remove members"
  on public.organization_members for delete to authenticated
  using (public.is_org_admin(org_id) and role <> 'owner');

-- bots ----------------------------------------------------------------------------
create policy "members read bots"
  on public.bots for select to authenticated
  using (public.is_org_member(org_id));

create policy "admins create bots"
  on public.bots for insert to authenticated
  with check (public.is_org_admin(org_id));

create policy "admins update bots"
  on public.bots for update to authenticated
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "admins delete bots"
  on public.bots for delete to authenticated
  using (public.is_org_admin(org_id));

-- knowledge_chunks ------------------------------------------------------------------
create policy "members read knowledge"
  on public.knowledge_chunks for select to authenticated
  using (public.can_access_bot(bot_id));

create policy "admins add knowledge"
  on public.knowledge_chunks for insert to authenticated
  with check (public.can_access_bot(bot_id, true));

create policy "admins delete knowledge"
  on public.knowledge_chunks for delete to authenticated
  using (public.can_access_bot(bot_id, true));

-- conversations ---------------------------------------------------------------------
-- Created only by the server-side engine (service role). Agents can read and
-- move conversations through the handoff workflow.
create policy "members read conversations"
  on public.conversations for select to authenticated
  using (public.can_access_bot(bot_id));

create policy "members update conversations"
  on public.conversations for update to authenticated
  using (public.can_access_bot(bot_id))
  with check (public.can_access_bot(bot_id));

-- messages --------------------------------------------------------------------------
create policy "members read messages"
  on public.messages for select to authenticated
  using (public.can_access_conversation(conversation_id));

-- Agents may only write messages as themselves; customer and AI messages are
-- written by the engine with the service role.
create policy "agents send messages"
  on public.messages for insert to authenticated
  with check (
    sender_type = 'human_agent'
    and sender_user_id = (select auth.uid())
    and public.can_access_conversation(conversation_id)
  );

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on public.knowledge_sources from authenticated;
grant select on public.knowledge_sources to authenticated;
revoke execute on all functions in schema public from anon, public;

-- The encrypted WhatsApp token must never reach a browser: grant column-level
-- SELECT/UPDATE on organizations without it. The server writes it with the
-- service role after encrypting it.
revoke select, update on public.organizations from authenticated;
grant select (id, name, plan_tier, whatsapp_phone_number_id, created_at, updated_at)
  on public.organizations to authenticated;
grant update (name, whatsapp_phone_number_id) on public.organizations to authenticated;

grant execute on function public.is_org_member(uuid) to authenticated, service_role;
grant execute on function public.is_org_admin(uuid) to authenticated, service_role;
grant execute on function public.can_access_bot(uuid, boolean) to authenticated, service_role;
grant execute on function public.can_access_conversation(uuid) to authenticated, service_role;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.match_knowledge_chunks(extensions.vector, uuid, int, float)
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Realtime: the Live Handoff Inbox subscribes to changes on these tables.
-- Supabase Realtime applies the RLS policies above to postgres_changes, so an
-- agent only receives events for their own organization.
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.conversations, public.messages;

-- The engine also sends lightweight "inbox:<org_id>" broadcast pings (ids only,
-- no message content) on private channels. Only members of that organization
-- may subscribe to them.
create policy "members receive their organization's inbox pings"
  on realtime.messages for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and case
      when (select realtime.topic()) ~ '^inbox:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then public.is_org_member(substr((select realtime.topic()), 7)::uuid)
      else false
    end
  );

-- -----------------------------------------------------------------------------
-- Storage: private bucket for customer voice notes.
-- Objects are written by the server as <org_id>/<conversation_id>/<uuid>.<ext>
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-notes',
  'voice-notes',
  false,
  16777216,
  array['audio/ogg', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/amr', 'audio/wav']
)
on conflict (id) do nothing;

create policy "members read their org's voice notes"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'voice-notes'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );
