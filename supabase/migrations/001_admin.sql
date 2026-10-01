-- Upgrades a DB created from the original schema.sql. Run once in Supabase SQL editor.
create table categories (
  slug text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
insert into categories (slug, name) values ('women', 'Women'), ('men', 'Men');

alter table products drop constraint products_category_check;
alter table products add foreign key (category) references categories (slug);
-- existing products start at 0 stock: set real counts in /admin/inventory
alter table products add column stock jsonb not null default '{}';

create table collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table collection_products (
  collection_id uuid not null references collections on delete cascade,
  product_id uuid not null references products on delete cascade,
  primary key (collection_id, product_id)
);

alter table orders drop constraint orders_status_check;
alter table orders add constraint orders_status_check check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled'));
create index on orders (status, created_at);

create function adjust_stock(p_items jsonb, p_sign int) returns void language plpgsql as $$
declare i jsonb;
begin
  for i in select * from jsonb_array_elements(p_items) loop
    update products
    set stock = jsonb_set(stock, array[i->>'size'],
      to_jsonb(greatest(coalesce((stock->>(i->>'size'))::int, 0) + p_sign * (i->>'qty')::int, 0)))
    where id = (i->>'id')::uuid;
  end loop;
end $$;
revoke execute on function adjust_stock from public, anon, authenticated;

alter table categories enable row level security;
alter table collections enable row level security;
alter table collection_products enable row level security;
