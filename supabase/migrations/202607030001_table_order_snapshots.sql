alter table public.orders
add column if not exists table_name text,
add column if not exists table_code text;

update public.orders o
set
  table_name = coalesce(o.table_name, t.name),
  table_code = coalesce(o.table_code, t.table_code)
from public.tables t
where o.table_id = t.id;

do $$
declare
  constraint_name text;
begin
  select tc.constraint_name
  into constraint_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
    and tc.table_schema = kcu.table_schema
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name
    and ccu.table_schema = tc.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'orders'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'table_id'
    and ccu.table_name = 'tables'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.orders drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.orders
alter column table_id drop not null;

alter table public.orders
add constraint orders_table_id_fkey
foreign key (table_id)
references public.tables(id)
on delete set null;
