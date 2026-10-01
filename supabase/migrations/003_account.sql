-- Wishlist + saved addresses. Run once in Supabase SQL editor.
create table wishlist (
  user_id text not null,                   -- Clerk user id
  product_id uuid not null references products on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,                   -- Clerk user id
  name text not null,
  phone text not null,
  line1 text not null,
  city text not null,
  state text not null,
  pincode text not null,
  created_at timestamptz not null default now()
);
create index on addresses (user_id);

alter table wishlist enable row level security;
alter table addresses enable row level security;
