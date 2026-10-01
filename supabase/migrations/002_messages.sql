-- Contact form inbox. Run once in Supabase SQL editor.
create table messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on messages (created_at);
alter table messages enable row level security;
