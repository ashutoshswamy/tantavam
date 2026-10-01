-- DESTROYS ALL APP DATA. Drops everything schema.sql creates; run schema.sql after.
drop table if exists
  stock_movements, audit_logs, reviews, messages, addresses, wishlist,
  coupons, orders, collection_products, collections, products, categories
  cascade;
drop function if exists adjust_stock(jsonb, int, text);
drop function if exists adjust_stock(jsonb, int);
drop function if exists set_stock(uuid, jsonb, text);
drop function if exists log_stock_change();
