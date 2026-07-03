with category_data(name, name_en, description, description_en, sort_order) as (
  values
    ('Başlangıçlar', 'Starters', 'Paylaşmalık sıcak ve soğuk başlangıçlar', 'Warm and cold plates to start the table', 1),
    ('Salatalar', 'Salads', 'Taze yeşillikler ve doyurucu salata tabakları', 'Fresh greens and satisfying salad plates', 2),
    ('Ana Yemekler', 'Main Courses', 'Izgara ve mutfak klasikleri', 'Grilled plates and kitchen classics', 3),
    ('Burger & Sandviç', 'Burgers & Sandwiches', 'Ekmek arası doyurucu favoriler', 'Comforting favorites served in bread', 4),
    ('İçecekler', 'Drinks', 'Kahve, limonata ve ferah içecekler', 'Coffee, lemonade and refreshing drinks', 5),
    ('Tatlılar', 'Desserts', 'Günlük hazırlanan tatlılar', 'Desserts prepared fresh daily', 6)
),
updated as (
  update public.categories
  set
    name = category_data.name,
    name_en = category_data.name_en,
    description = category_data.description,
    description_en = category_data.description_en,
    sort_order = category_data.sort_order,
    is_active = true
  from category_data
  where public.categories.name = category_data.name
     or public.categories.name_en = category_data.name_en
  returning public.categories.id
)
insert into public.categories (name, name_en, description, description_en, sort_order, is_active)
select name, name_en, description, description_en, sort_order, true
from category_data
where not exists (
  select 1
  from public.categories
  where public.categories.name = category_data.name
     or public.categories.name_en = category_data.name_en
);

with menu_data(category_name, name, name_en, description, description_en, price, image_url, calories, carbs, protein, fat, sort_order) as (
  values
    ('Başlangıçlar', 'Avokadolu Bruschetta', 'Avocado Bruschetta', 'Ekşi mayalı ekmek, avokado kreması, kiraz domates ve fesleğen.', 'Sourdough bread, avocado cream, cherry tomatoes and basil.', 185, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', 320, 28, 8, 19, 1),
    ('Başlangıçlar', 'Trüflü Patates', 'Truffle Fries', 'Çıtır patates, trüf yağı, parmesan ve taze otlar.', 'Crispy fries with truffle oil, parmesan and fresh herbs.', 155, 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80', 430, 52, 8, 20, 2),
    ('Başlangıçlar', 'Humus Tabağı', 'Hummus Plate', 'Nohut humusu, zeytinyağı, baharatlı nohut ve pita ekmeği.', 'Chickpea hummus with olive oil, spiced chickpeas and pita bread.', 165, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', 390, 42, 13, 18, 3),
    ('Salatalar', 'Izgara Tavuklu Sezar', 'Grilled Chicken Caesar', 'Izgara tavuk, marul, parmesan, kruton ve Sezar sos.', 'Grilled chicken, romaine, parmesan, croutons and Caesar dressing.', 285, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80', 470, 22, 36, 26, 1),
    ('Salatalar', 'Akdeniz Salatası', 'Mediterranean Salad', 'Domates, salatalık, zeytin, beyaz peynir, yeşillik ve limon sos.', 'Tomato, cucumber, olives, feta, greens and lemon dressing.', 235, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 330, 24, 10, 22, 2),
    ('Salatalar', 'Somon Salata', 'Salmon Salad', 'Izgara somon, avokado, yeşillik, turp ve hardallı narenciye sos.', 'Grilled salmon, avocado, greens, radish and mustard citrus dressing.', 360, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80', 520, 18, 34, 34, 3),
    ('Ana Yemekler', 'Izgara Köfte', 'Grilled Meatballs', 'Izgara köfte, közlenmiş sebze, pirinç pilavı ve yoğurtlu sos.', 'Grilled meatballs with roasted vegetables, rice pilaf and yogurt sauce.', 345, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80', 680, 48, 42, 34, 1),
    ('Ana Yemekler', 'Fesleğenli Makarna', 'Basil Pasta', 'Taze fesleğen pesto, parmesan ve kavrulmuş çam fıstığı.', 'Fresh basil pesto, parmesan and toasted pine nuts.', 285, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80', 610, 72, 18, 24, 2),
    ('Ana Yemekler', 'Somon Izgara', 'Grilled Salmon', 'Izgara somon, limonlu patates, mevsim yeşillikleri ve otlu sos.', 'Grilled salmon with lemon potatoes, seasonal greens and herb sauce.', 420, 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80', 590, 32, 41, 31, 3),
    ('Burger & Sandviç', 'Verde Burger', 'Verde Burger', 'Dana burger, cheddar, karamelize soğan, turşu ve Verde sos.', 'Beef burger with cheddar, caramelized onion, pickles and Verde sauce.', 335, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 760, 58, 39, 42, 1),
    ('Burger & Sandviç', 'Izgara Sebzeli Sandviç', 'Grilled Vegetable Sandwich', 'Izgara kabak, patlıcan, biber, pesto ve mozzarella.', 'Grilled zucchini, eggplant, peppers, pesto and mozzarella.', 255, 'https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=800&q=80', 480, 54, 17, 22, 2),
    ('Burger & Sandviç', 'Füme Etli Sandviç', 'Smoked Beef Sandwich', 'Füme et, hardallı sos, roka, turşu ve ekşi mayalı ekmek.', 'Smoked beef, mustard sauce, arugula, pickles and sourdough bread.', 315, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', 610, 50, 33, 29, 3),
    ('İçecekler', 'Ev Yapımı Limonata', 'Homemade Lemonade', 'Nane, limon ve az şekerli ferah karışım.', 'A refreshing blend of mint, lemon and a little sugar.', 95, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80', 110, 27, 0, 0, 1),
    ('İçecekler', 'Cold Brew', 'Cold Brew', '18 saat demlenmiş soğuk kahve.', 'Cold coffee brewed for 18 hours.', 120, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80', 20, 3, 1, 0, 2),
    ('İçecekler', 'Berry Ice Tea', 'Berry Ice Tea', 'Orman meyveleri, siyah çay ve buzla hazırlanan ferah içecek.', 'A refreshing iced black tea with forest berries.', 115, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 95, 23, 0, 0, 3),
    ('Tatlılar', 'San Sebastian', 'San Sebastian Cheesecake', 'Kremamsı cheesecake, orman meyveli sos.', 'Creamy cheesecake with forest berry sauce.', 175, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', 460, 38, 9, 30, 1),
    ('Tatlılar', 'Tiramisu Kup', 'Tiramisu Cup', 'Espresso ile ıslatılmış kek, mascarpone kreması ve kakao.', 'Espresso-soaked cake, mascarpone cream and cocoa.', 165, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 410, 44, 7, 22, 2),
    ('Tatlılar', 'Çikolatalı Brownie', 'Chocolate Brownie', 'Yoğun çikolatalı brownie, vanilyalı dondurma ve fındık kırığı.', 'Rich chocolate brownie with vanilla ice cream and crushed hazelnuts.', 155, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', 520, 58, 8, 28, 3)
),
updated as (
  update public.menu_items
  set
    category_id = categories.id,
    name = menu_data.name,
    name_en = menu_data.name_en,
    description = menu_data.description,
    description_en = menu_data.description_en,
    price = menu_data.price,
    image_url = menu_data.image_url,
    calories = menu_data.calories,
    carbs = menu_data.carbs,
    protein = menu_data.protein,
    fat = menu_data.fat,
    sort_order = menu_data.sort_order,
    is_available = true
  from menu_data
  join public.categories on categories.name = menu_data.category_name
  where public.menu_items.name = menu_data.name
     or public.menu_items.name_en = menu_data.name_en
  returning public.menu_items.id
)
insert into public.menu_items (category_id, name, name_en, description, description_en, price, image_url, calories, carbs, protein, fat, sort_order, is_available)
select categories.id, menu_data.name, menu_data.name_en, menu_data.description, menu_data.description_en, menu_data.price, menu_data.image_url, menu_data.calories, menu_data.carbs, menu_data.protein, menu_data.fat, menu_data.sort_order, true
from menu_data
join public.categories on categories.name = menu_data.category_name
where not exists (
  select 1
  from public.menu_items
  where public.menu_items.name = menu_data.name
     or public.menu_items.name_en = menu_data.name_en
);
