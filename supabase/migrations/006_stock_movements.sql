-- Stock history: a trigger records every per-size change to products.stock, whoever made it.
-- Callers label the change by setting app.stock_reason in the same transaction (adjust_stock / set_stock do).
-- Run once in Supabase SQL editor.
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  product_name text not null,
  size text not null,
  before int not null,
  after int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index on stock_movements (created_at);
create index on stock_movements (product_id, created_at);
alter table stock_movements enable row level security;

create function log_stock_change() returns trigger language plpgsql as $$
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
create trigger products_stock_log after update of stock on products
  for each row when (old.stock is distinct from new.stock) execute function log_stock_change();

-- adjust_stock gains a reason (drop first: adding a param would leave an ambiguous overload)
drop function adjust_stock(jsonb, int);
create function adjust_stock(p_items jsonb, p_sign int, p_reason text default null) returns void language plpgsql as $$
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
revoke execute on function adjust_stock from public, anon, authenticated;

-- manual stock edits from /admin/inventory
create function set_stock(p_id uuid, p_stock jsonb, p_reason text) returns void language plpgsql as $$
begin
  perform set_config('app.stock_reason', p_reason, true);
  update products set stock = p_stock where id = p_id;
end $$;
revoke execute on function set_stock from public, anon, authenticated;
