create extension if not exists "pgcrypto";

create type public.order_status as enum ('new', 'preparing', 'ready', 'completed', 'cancelled');

create table public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  tagline text,
  description text,
  description_en text,
  logo_url text,
  primary_color text not null default '#214e38',
  accent_color text not null default '#c69c52',
  currency text not null default 'TRY',
  service_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  table_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  description text,
  description_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  name_en text,
  description text,
  description_en text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete restrict,
  customer_note text,
  status public.order_status not null default 'new',
  total_amount numeric(10,2) not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text,
  item_image_url text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  item_note text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_restaurant_settings_updated_at
before update on public.restaurant_settings
for each row execute function public.set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.restaurant_settings enable row level security;
alter table public.tables enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public can read restaurant settings" on public.restaurant_settings
for select using (true);

create policy "Public can read active tables" on public.tables
for select using (is_active = true or auth.role() = 'authenticated');

create policy "Public can read active categories" on public.categories
for select using (is_active = true or auth.role() = 'authenticated');

create policy "Public can read available menu items" on public.menu_items
for select using (is_available = true or auth.role() = 'authenticated');

create policy "Public can create orders" on public.orders
for insert with check (true);

create policy "Public can create order items" on public.order_items
for insert with check (true);

create policy "Admins can manage restaurant settings" on public.restaurant_settings
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admins can manage tables" on public.tables
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admins can manage categories" on public.categories
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admins can manage menu items" on public.menu_items
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admins can manage orders" on public.orders
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admins can manage order items" on public.order_items
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public;

create policy "Public can view menu images" on storage.objects
for select using (bucket_id = 'menu-images');

create policy "Admins can upload menu images" on storage.objects
for insert with check (bucket_id = 'menu-images' and auth.role() = 'authenticated');

create policy "Admins can update menu images" on storage.objects
for update using (bucket_id = 'menu-images' and auth.role() = 'authenticated');

create policy "Admins can delete menu images" on storage.objects
for delete using (bucket_id = 'menu-images' and auth.role() = 'authenticated');
