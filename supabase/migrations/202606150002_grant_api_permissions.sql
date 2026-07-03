grant usage on schema public to anon, authenticated;

grant select on public.restaurant_settings to anon, authenticated;
grant select on public.tables to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.menu_items to anon, authenticated;

grant insert on public.orders to anon, authenticated;
grant insert on public.order_items to anon, authenticated;

grant select, update on public.orders to authenticated;
grant select, update, delete on public.order_items to authenticated;
grant insert, update, delete on public.restaurant_settings to authenticated;
grant insert, update, delete on public.tables to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.menu_items to authenticated;
