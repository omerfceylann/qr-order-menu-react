alter table public.categories
add column if not exists name_en text,
add column if not exists description_en text;

alter table public.menu_items
add column if not exists name_en text,
add column if not exists description_en text;

alter table public.menu_items
drop column if exists tags;
