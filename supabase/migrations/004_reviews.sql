-- Product reviews with moderation. Run once in Supabase SQL editor.
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  user_id text not null,                   -- Clerk user id
  author text not null,                    -- display name captured at submit
  rating smallint not null check (rating between 1 and 5),
  body text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  unique (product_id, user_id)             -- one review per person per product; resubmitting edits it
);
create index on reviews (product_id, status);
create index on reviews (status, created_at);
alter table reviews enable row level security;
