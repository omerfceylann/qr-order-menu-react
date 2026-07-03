alter table public.restaurant_settings
add column if not exists description_en text;

update public.restaurant_settings
set description_en = coalesce(
  description_en,
  'Seasonal plates, coffees and desserts prepared with fresh ingredients. Order from your table and we will take care of the rest.'
);
