-- Run in Supabase SQL editor. Safe to re-run: creates whatever is missing and leaves existing tables and data alone.
-- It does not alter a table that already exists; add new columns with an explicit alter table.
-- To wipe everything and start over, run reset.sql first.
-- RLS on with no policies = only the service role (server) can read/write.
create table if not exists categories (
  slug text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
insert into categories (slug, name) values ('women', 'Women') on conflict do nothing;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price integer not null check (price > 0), -- paise
  category text not null references categories (slug), -- delete blocked while in use
  sizes text[] not null default '{XS,S,M,L,XL,XXL,XXXL}',
  stock jsonb not null default '{}',       -- {"S": 4, "M": 0}; missing size = 0
  images text[] not null default '{}',     -- Cloudinary secure_urls
  hidden boolean not null default false,   -- true = invisible and unbuyable on the storefront
  badge text,                              -- optional label on cards and the product page ("Best seller")
  highlights text,                         -- "Craft: Rogan" lines, overlaid on the product photo; empty = none
  care text,                               -- wash care shown on the product page; empty = hidden
  created_at timestamptz not null default now()
);
-- existing DBs: alter table products add column if not exists hidden boolean not null default false;
-- existing DBs: alter table products add column if not exists badge text;
-- existing DBs: alter table products add column if not exists care text;
-- existing DBs: alter table products add column if not exists highlights text;
-- existing DBs: alter table coupons add column if not exists public boolean not null default false;

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists collection_products (
  collection_id uuid not null references collections on delete cascade,
  product_id uuid not null references products on delete cascade,
  primary key (collection_id, product_id)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,                   -- Clerk user id, or 'whatsapp' for a hand-entered order with no account
  items jsonb not null,                    -- [{id, name, size, qty, price}]
  subtotal integer not null,               -- paise, before discount
  discount integer not null default 0,     -- paise
  coupon_code text,                        -- code applied, incl. the first-order rule
  amount integer not null,                 -- paise, what was charged
  address jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  razorpay_order_id text unique not null,  -- order reference: Razorpay's id, or wa_xxxx for an order entered in /admin/orders/new
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_coupon_code_idx on orders (coupon_code) where coupon_code is not null;
create index if not exists orders_status_created_at_idx on orders (status, created_at);

create table if not exists coupons (
  code text primary key check (code = upper(code) and code <> ''),
  kind text not null check (kind in ('percent', 'flat')),
  value int not null check (value > 0),          -- percent (1-100) or paise
  min_order int not null default 0,              -- paise
  max_uses int check (max_uses > 0),             -- total paid uses; null = unlimited
  expires_at timestamptz,
  active boolean not null default true,
  first_order boolean not null default false,    -- the automatic first-purchase discount; can't be typed in as a code
  first_purchase_only boolean not null default false, -- typed code that only works on a customer's first paid order
  public boolean not null default false,         -- advertised under products on the storefront
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);
create unique index if not exists coupons_one_first_order on coupons (first_order) where first_order;
insert into coupons (code, kind, value, active, first_order) values ('FIRST-ORDER', 'percent', 10, false, true) on conflict do nothing;

create table if not exists invoices (                   -- admin-made invoices (/admin/invoices); rows are snapshots, so editing a product later never changes an old invoice
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,       -- shown as TNT-0001
  invoice_date date not null default current_date,
  customer jsonb not null default '{}',          -- {name, phone, address}
  items jsonb not null default '[]',             -- [{productId, name, size, qty, unit}] unit in paise
  adjustments jsonb not null default '[]',       -- [{label, type: discount|charge, mode: flat|percent, value}] flat in paise
  notes text not null default '',
  subtotal int not null,                         -- paise
  total int not null,                            -- paise
  created_at timestamptz not null default now()
);

create table if not exists settings (                    -- store-wide switches, edited in /admin/settings
  key text primary key,
  value text not null
);
insert into settings (key, value) values ('checkout', 'razorpay') on conflict do nothing; -- 'razorpay' | 'whatsapp'

create table if not exists wishlist (
  user_id text not null,                   -- Clerk user id
  product_id uuid not null references products on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists addresses (
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
create index if not exists addresses_user_id_idx on addresses (user_id);

create table if not exists messages (                    -- contact form inbox
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_created_at_idx on messages (created_at);

create table if not exists reviews (
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
create index if not exists reviews_product_id_status_idx on reviews (product_id, status);
create index if not exists reviews_status_created_at_idx on reviews (status, created_at);

create table if not exists audit_logs (                -- who did what in the admin panel
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,                  -- Clerk user id
  actor_name text not null,
  actor_role text not null check (actor_role in ('admin', 'staff')),
  section text not null,
  action text not null,
  target text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on audit_logs (created_at);
create index if not exists audit_logs_actor_id_created_at_idx on audit_logs (actor_id, created_at);

create table if not exists stock_movements (           -- stock history, filled by the trigger below
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  product_name text not null,
  size text not null,
  before int not null,
  after int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_created_at_idx on stock_movements (created_at);
create index if not exists stock_movements_product_id_created_at_idx on stock_movements (product_id, created_at);

-- Records every per-size change to products.stock. Callers label it via app.stock_reason in the same transaction.
create or replace function log_stock_change() returns trigger language plpgsql as $$
declare k text; o int; n int;
begin
  for k in select jsonb_object_keys(old.stock || new.stock) loop
    o := coalesce((old.stock->>k)::int, 0);
    n := coalesce((new.stock->>k)::int, 0);
    if o <> n then
      insert into stock_movements (product_id, product_name, size, before, after, reason)
      values (new.id, new.name, k, o, n, coalesce(nullif(current_setting('app.stock_reason', true), ''), 'Product edited'));
    end if;
  end loop;
  return new;
end $$;
create or replace trigger products_stock_log after update of stock on products
  for each row when (old.stock is distinct from new.stock) execute function log_stock_change();

-- Adds sign * qty to each order item's size stock, floored at 0. -1 on payment, +1 on cancel.
create or replace function adjust_stock(p_items jsonb, p_sign int, p_reason text default null) returns void language plpgsql as $$
declare i jsonb;
begin
  perform set_config('app.stock_reason', coalesce(p_reason, ''), true);
  for i in select * from jsonb_array_elements(p_items) loop
    update products
    set stock = jsonb_set(stock, array[i->>'size'],
      to_jsonb(greatest(coalesce((stock->>(i->>'size'))::int, 0) + p_sign * (i->>'qty')::int, 0)))
    where id = (i->>'id')::uuid;
  end loop;
end $$;
-- Supabase exposes public functions over the API; server only.
revoke execute on function adjust_stock from public, anon, authenticated;

-- Manual stock edits from /admin/inventory.
create or replace function set_stock(p_id uuid, p_stock jsonb, p_reason text) returns void language plpgsql as $$
begin
  perform set_config('app.stock_reason', p_reason, true);
  update products set stock = p_stock where id = p_id;
end $$;
revoke execute on function set_stock from public, anon, authenticated;

alter table categories enable row level security;
alter table products enable row level security;
alter table collections enable row level security;
alter table collection_products enable row level security;
alter table orders enable row level security;
alter table messages enable row level security;
alter table wishlist enable row level security;
alter table addresses enable row level security;
alter table reviews enable row level security;
alter table audit_logs enable row level security;
alter table stock_movements enable row level security;
alter table coupons enable row level security;
alter table settings enable row level security;
alter table invoices enable row level security;

-- Defense in depth: even if RLS were switched off on a table, the public API roles get nothing. Server uses the service role.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
