alter table public.order_items
add column if not exists item_name text,
add column if not exists item_image_url text;

update public.order_items
set
  item_name = coalesce(public.order_items.item_name, public.menu_items.name),
  item_image_url = coalesce(public.order_items.item_image_url, public.menu_items.image_url)
from public.menu_items
where public.order_items.menu_item_id = public.menu_items.id;

alter table public.order_items
alter column menu_item_id drop not null;

alter table public.order_items
drop constraint if exists order_items_menu_item_id_fkey;

alter table public.order_items
add constraint order_items_menu_item_id_fkey
foreign key (menu_item_id)
references public.menu_items(id)
on delete set null;
