alter table public.restaurant_settings
add column if not exists theme_mode text not null default 'light' check (theme_mode in ('light', 'dark')),
add column if not exists language text not null default 'tr' check (language in ('tr', 'en'));

update public.restaurant_settings
set theme_mode = coalesce(theme_mode, 'light'),
    language = coalesce(language, 'tr');
