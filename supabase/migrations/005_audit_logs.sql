-- Who did what in the admin panel. Run once in Supabase SQL editor.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,                  -- Clerk user id
  actor_name text not null,
  actor_role text not null check (actor_role in ('admin', 'staff')),
  section text not null,
  action text not null,
  target text not null default '',
  created_at timestamptz not null default now()
);
create index on audit_logs (created_at);
create index on audit_logs (actor_id, created_at);
alter table audit_logs enable row level security;
