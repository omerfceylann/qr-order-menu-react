alter table public.restaurant_settings
add column if not exists background_image_url text,
add column if not exists font_key text not null default 'manrope';

alter table public.menu_items
add column if not exists calories integer check (calories is null or calories >= 0),
add column if not exists carbs numeric(8,2) check (carbs is null or carbs >= 0),
add column if not exists protein numeric(8,2) check (protein is null or protein >= 0),
add column if not exists fat numeric(8,2) check (fat is null or fat >= 0);

update public.restaurant_settings
set
  background_image_url = coalesce(background_image_url, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80'),
  font_key = coalesce(nullif(font_key, ''), 'manrope');

update public.menu_items
set calories = 320, carbs = 28, protein = 8, fat = 19
where name = 'Avokadolu Bruschetta' and calories is null;

update public.menu_items
set calories = 540, carbs = 48, protein = 38, fat = 18
where name = 'Izgara Tavuk Bowl' and calories is null;

update public.menu_items
set calories = 610, carbs = 72, protein = 18, fat = 24
where name = 'Feslegenli Makarna' and calories is null;

update public.menu_items
set calories = 110, carbs = 27, protein = 0, fat = 0
where name = 'Ev Yapimi Limonata' and calories is null;

update public.menu_items
set calories = 20, carbs = 3, protein = 1, fat = 0
where name = 'Cold Brew' and calories is null;

update public.menu_items
set calories = 460, carbs = 38, protein = 9, fat = 30
where name = 'San Sebastian' and calories is null;
