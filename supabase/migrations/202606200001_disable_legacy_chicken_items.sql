update public.menu_items
set is_available = false
where name in ('Tavuklu Salata', 'Izgara Tavuk Bowl')
   or name_en in ('Chicken Salad', 'Grilled Chicken Bowl');
