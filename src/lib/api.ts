import { supabase } from './supabase';
import type { Category, MenuItem, Order, RestaurantSettings, TableRow } from './types';

export async function fetchMenuData() {
  const [settings, tables, categories, items] = await Promise.all([
    supabase.from('restaurant_settings').select('*').limit(1).maybeSingle(),
    supabase.from('tables').select('*').order('created_at', { ascending: true }),
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
  ]);

  if (settings.error) throw settings.error;
  if (tables.error) throw tables.error;
  if (categories.error) throw categories.error;
  if (items.error) throw items.error;

  return {
    settings: settings.data as RestaurantSettings | null,
    tables: tables.data as TableRow[],
    categories: categories.data as Category[],
    items: items.data as MenuItem[],
  };
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, tables(name, table_code), order_items(*, menu_items(name, image_url))')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
}

export async function uploadImage(file: File, folder = 'menu') {
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('menu-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
  return data.publicUrl;
}

export function uploadMenuImage(file: File) {
  return uploadImage(file, 'menu');
}
