update public.categories
set name = 'Başlangıçlar',
    name_en = coalesce(nullif(name_en, ''), 'Starters'),
    description = coalesce(nullif(description, ''), 'Paylaşmalık hafif tabaklar'),
    description_en = coalesce(nullif(description_en, ''), 'Light plates to share')
where name in ('Baslangiclar', 'Başlangıçlar');

update public.categories
set name = 'Ana Yemekler',
    name_en = coalesce(nullif(name_en, ''), 'Main Courses'),
    description = coalesce(nullif(description, ''), 'Doyurucu restoran klasikleri'),
    description_en = coalesce(nullif(description_en, ''), 'Satisfying restaurant classics')
where name in ('Ana Yemekler', 'Main Courses');

update public.categories
set name = 'İçecekler',
    name_en = coalesce(nullif(name_en, ''), 'Drinks'),
    description = coalesce(nullif(description, ''), 'Kahve, limonata ve soğuk içecekler'),
    description_en = coalesce(nullif(description_en, ''), 'Coffee, lemonade and cold drinks')
where name in ('Icecekler', 'İçecekler', 'Drinks');

update public.categories
set name = 'Tatlılar',
    name_en = coalesce(nullif(name_en, ''), 'Desserts'),
    description = coalesce(nullif(description, ''), 'Günlük tatlı seçimleri'),
    description_en = coalesce(nullif(description_en, ''), 'Daily dessert selections')
where name in ('Tatlilar', 'Tatlılar', 'Desserts');

update public.menu_items
set name = 'Fesleğenli Makarna',
    name_en = coalesce(nullif(name_en, ''), 'Basil Pasta'),
    description = coalesce(nullif(description, ''), 'Taze fesleğen pesto, parmesan ve kavrulmuş çam fıstığı.'),
    description_en = coalesce(nullif(description_en, ''), 'Fresh basil pesto, parmesan and toasted pine nuts.')
where name in ('Feslegenli Makarna', 'Fesleğenli Makarna');

update public.menu_items
set name = 'Ev Yapımı Limonata',
    name_en = coalesce(nullif(name_en, ''), 'Homemade Lemonade'),
    description = coalesce(nullif(description, ''), 'Nane, limon ve az şekerli ferah karışım.'),
    description_en = coalesce(nullif(description_en, ''), 'A refreshing blend of mint, lemon and a little sugar.')
where name in ('Ev Yapimi Limonata', 'Ev Yapımı Limonata');

update public.menu_items
set name_en = coalesce(nullif(name_en, ''), 'Avocado Bruschetta'),
    description_en = coalesce(nullif(description_en, ''), 'Sourdough bread, avocado cream, cherry tomatoes and basil.')
where name = 'Avokadolu Bruschetta';

update public.menu_items
set name_en = coalesce(nullif(name_en, ''), 'Grilled Chicken Bowl'),
    description_en = coalesce(nullif(description_en, ''), 'Grilled chicken, greens, quinoa rice and herbed yogurt sauce.')
where name = 'Izgara Tavuk Bowl';

update public.menu_items
set name_en = coalesce(nullif(name_en, ''), 'Cold Brew'),
    description_en = coalesce(nullif(description_en, ''), 'Cold coffee brewed for 18 hours.')
where name = 'Cold Brew';

update public.menu_items
set name_en = coalesce(nullif(name_en, ''), 'San Sebastian'),
    description_en = coalesce(nullif(description_en, ''), 'Creamy cheesecake with forest berry sauce.')
where name = 'San Sebastian';
