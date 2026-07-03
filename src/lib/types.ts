export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ThemeMode = 'light' | 'dark';
export type Language = 'tr' | 'en';

export type RestaurantSettings = {
  id: string;
  restaurant_name: string;
  tagline: string | null;
  description: string | null;
  description_en: string | null;
  logo_url: string | null;
  background_image_url: string | null;
  primary_color: string;
  accent_color: string;
  currency: string;
  font_key: string;
  theme_mode: ThemeMode;
  language: Language;
  service_enabled: boolean;
  updated_at: string;
};

export type TableRow = {
  id: string;
  name: string;
  table_code: string;
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  calories: number | null;
  carbs: number | null;
  protein: number | null;
  fat: number | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type Order = {
  id: string;
  table_id: string | null;
  table_name: string | null;
  table_code: string | null;
  customer_note: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  tables?: Pick<TableRow, 'name' | 'table_code'> | null;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string | null;
  item_image_url: string | null;
  quantity: number;
  unit_price: number;
  item_note: string | null;
  created_at: string;
  menu_items?: Pick<MenuItem, 'name' | 'image_url'> | null;
};

export type Database = {
  public: {
    Tables: {
      restaurant_settings: {
        Row: RestaurantSettings;
        Insert: Partial<RestaurantSettings>;
        Update: Partial<RestaurantSettings>;
      };
      tables: {
        Row: TableRow;
        Insert: Partial<TableRow>;
        Update: Partial<TableRow>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Category>;
        Update: Partial<Category>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Partial<MenuItem>;
        Update: Partial<MenuItem>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order>;
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem>;
        Update: Partial<OrderItem>;
      };
    };
  };
};

export type CartLine = {
  item: MenuItem;
  quantity: number;
  note: string;
};
