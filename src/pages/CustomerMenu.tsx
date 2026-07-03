import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Moon, Minus, Plus, ShoppingBag, Sun, X } from 'lucide-react';
import { Button, EmptyState, Textarea } from '../components/ui';
import { fetchMenuData } from '../lib/api';
import { formatMoney } from '../lib/format';
import { getLanguage, t } from '../lib/i18n';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { resolveThemeColors } from '../lib/theme';
import type { CartLine, Category, Language, MenuItem, RestaurantSettings, TableRow, ThemeMode } from '../lib/types';

const menuFontClasses: Record<string, string> = {
  manrope: 'menu-font-manrope',
  fraunces: 'menu-font-fraunces',
  nunito: 'menu-font-nunito',
  lora: 'menu-font-lora',
  montserrat: 'menu-font-montserrat',
};

const CUSTOMER_LANGUAGE_KEY = 'qr-menu-customer-language';
const CUSTOMER_THEME_KEY = 'qr-menu-customer-theme';

type LocalizedText = {
  name: string;
  name_en?: string | null;
  description?: string | null;
  description_en?: string | null;
};

function localizedName(row: LocalizedText, language: Language) {
  return language === 'en' && row.name_en?.trim() ? row.name_en : row.name;
}

function localizedDescription(row: LocalizedText, language: Language) {
  return language === 'en' && row.description_en?.trim() ? row.description_en : row.description || '';
}

function localizedRestaurantDescription(settings: RestaurantSettings | null, language: Language) {
  if (language === 'en' && settings?.description_en?.trim()) return settings.description_en;
  return settings?.description || t(language, 'restaurantDescriptionFallback');
}

function readStoredLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(CUSTOMER_LANGUAGE_KEY);
  return value === 'en' || value === 'tr' ? value : null;
}

function readStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(CUSTOMER_THEME_KEY);
  return value === 'dark' || value === 'light' ? value : null;
}

export function CustomerMenu() {
  const { tableCode = '' } = useParams();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [table, setTable] = useState<TableRow | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [note, setNote] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [customerLanguage, setCustomerLanguage] = useState<Language | null>(() => readStoredLanguage());
  const [customerTheme, setCustomerTheme] = useState<ThemeMode | null>(() => readStoredTheme());
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const defaultThemeRef = useRef<ThemeMode>('light');
  const defaultLanguageRef = useRef<Language>('tr');
  const lang = customerLanguage || getLanguage(settings);
  const activeTheme = customerTheme || settings?.theme_mode || 'light';

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadError(t(lang, 'missingMenuConfig'));
      setLoading(false);
      return;
    }

    fetchMenuData()
      .then((data) => {
        setSettings(data.settings);
        setCategories(data.categories.filter((category) => category.is_active));
        setItems(data.items.filter((item) => item.is_available));
        setTable(data.tables.find((row) => row.table_code === tableCode && row.is_active) || null);
      })
      .catch(() => setLoadError(t(lang, 'menuLoadError')))
      .finally(() => setLoading(false));
  }, [tableCode]);

  useEffect(() => {
    defaultThemeRef.current = settings?.theme_mode || 'light';
    defaultLanguageRef.current = settings?.language || 'tr';
  }, [settings?.language, settings?.theme_mode]);

  useEffect(() => {
    if (!settings) return;
    const theme = resolveThemeColors(settings.primary_color, settings.accent_color);
    document.documentElement.style.setProperty('--brand', theme.primary);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--brand-dark', theme.darkPrimary);
    document.documentElement.style.setProperty('--accent-dark', theme.darkAccent);
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
  }, [activeTheme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.toggle('dark', defaultThemeRef.current === 'dark');
      document.documentElement.lang = defaultLanguageRef.current;
    };
  }, []);

  useEffect(() => {
    if (customerLanguage) window.localStorage.setItem(CUSTOMER_LANGUAGE_KEY, customerLanguage);
  }, [customerLanguage]);

  useEffect(() => {
    if (customerTheme) window.localStorage.setItem(CUSTOMER_THEME_KEY, customerTheme);
  }, [customerTheme]);

  const cartLines = Object.values(cart);
  const total = cartLines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const cartItemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const previewLines = cartLines.slice(0, 2);
  const hiddenLineCount = Math.max(0, cartLines.length - previewLines.length);

  useEffect(() => {
    if (cartLines.length === 0) setIsCartOpen(false);
  }, [cartLines.length]);

  function changeQuantity(item: MenuItem, delta: number) {
    setCart((current) => {
      const line = current[item.id] || { item, quantity: 0, note: '' };
      const nextQuantity = line.quantity + delta;
      if (nextQuantity <= 0) {
        const clone = { ...current };
        delete clone[item.id];
        return clone;
      }
      return { ...current, [item.id]: { ...line, quantity: nextQuantity } };
    });
  }

  async function submitOrder() {
    if (!table || cartLines.length === 0) return;
    setMessage(t(lang, 'orderLoading'));
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ table_id: table.id, table_name: table.name, table_code: table.table_code, customer_note: note || null, total_amount: total, status: 'new' })
      .select()
      .single();

    if (error || !order) {
      setMessage(t(lang, 'orderCreateError'));
      return;
    }

    const { error: itemError } = await supabase.from('order_items').insert(
      cartLines.map((line) => ({
        order_id: order.id,
        menu_item_id: line.item.id,
        item_name: localizedName(line.item, lang),
        item_image_url: line.item.image_url,
        quantity: line.quantity,
        unit_price: line.item.price,
        item_note: line.note || null,
      })),
    );

    if (itemError) {
      setMessage(t(lang, 'orderItemsError'));
      return;
    }

    setCart({});
    setNote('');
    setMessage(t(lang, 'orderSuccess')(table.name));
  }

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((category) => [category.id, localizedName(category, lang)]));
    return (id: string | null) => (id ? map.get(id) : t(lang, 'menu'));
  }, [categories, lang]);

  const groupedSections = useMemo(() => {
    const sections = categories
      .map((category) => ({
        id: category.id,
        name: localizedName(category, lang),
        description: localizedDescription(category, lang),
        items: items.filter((item) => item.category_id === category.id),
      }))
      .filter((section) => section.items.length > 0);
    const uncategorized = items.filter((item) => !item.category_id || !categories.some((category) => category.id === item.category_id));

    if (uncategorized.length > 0) {
      sections.push({ id: 'other', name: t(lang, 'other'), description: t(lang, 'categoryDescription'), items: uncategorized });
    }

    return sections;
  }, [categories, items, lang]);

  function scrollToCategory(categoryId: string) {
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleQuantityClick(event: React.MouseEvent, item: MenuItem, delta: number) {
    event.stopPropagation();
    changeQuantity(item, delta);
  }

  if (loading) return <main className="customer-page grid min-h-screen place-items-center">{t(lang, 'menuLoading')}</main>;
  if (loadError) {
    return (
      <main className="customer-page grid min-h-screen place-items-center p-5">
        <EmptyState title={t(lang, 'menuLoadError').split('.')[0]} text={loadError} />
      </main>
    );
  }
  if (!table) {
    return (
      <main className="customer-page grid min-h-screen place-items-center p-5">
        <EmptyState title={t(lang, 'tableMissing')} text={t(lang, 'tableMissingText')} />
      </main>
    );
  }

  return (
    <main className={`customer-page min-h-screen pb-40 md:pb-32 ${menuFontClasses[settings?.font_key || 'manrope'] || menuFontClasses.manrope}`}>
      <section
        className="relative overflow-hidden bg-[var(--brand)] px-4 pb-8 pt-24 text-white md:pb-12 md:pt-16"
        style={{
          backgroundImage: settings?.background_image_url ? `linear-gradient(120deg, color-mix(in srgb, var(--brand) 88%, #07110d), color-mix(in srgb, var(--accent) 46%, transparent)), url(${settings.background_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--accent)_34%,transparent),transparent_36%)]" />
        <div className="absolute right-3 top-3 z-10 md:right-6 md:top-5">
          <CustomerPreferences
            language={lang}
            theme={activeTheme}
            onLanguageChange={setCustomerLanguage}
            onThemeChange={setCustomerTheme}
          />
        </div>
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              {settings?.logo_url ? <img src={settings.logo_url} alt={settings.restaurant_name} className="h-16 w-16 rounded-lg border border-white/30 bg-white/90 object-cover p-1 shadow-soft" /> : null}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">{table.name}</p>
                {settings?.tagline ? <p className="mt-1 text-sm font-semibold text-white/90">{settings.tagline}</p> : null}
              </div>
            </div>
            <h1 className="font-display text-5xl leading-none text-white md:text-6xl">{settings?.restaurant_name || 'QR Menu'}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 md:text-lg">{localizedRestaurantDescription(settings, lang)}</p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="w-fit rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">{t(lang, 'inCart')(cartItemCount)}</div>
          </div>
        </div>
      </section>

      <header className="customer-panel sticky top-0 z-20 border-b px-4 py-3 backdrop-blur">
        {groupedSections.length > 0 ? (
          <nav className="scrollbar-hide mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-1">
            {groupedSections.map((section) => (
              <button key={section.id} onClick={() => scrollToCategory(section.id)} className="pill">
                {section.name}
              </button>
            ))}
          </nav>
        ) : null}
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-9">
          {groupedSections.map((section) => (
            <section
              key={section.id}
              ref={(node) => {
                sectionRefs.current[section.id] = node;
              }}
              className="scroll-mt-36"
            >
              <div className="mb-4 flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--theme-border)' }}>
                <div>
                  <h2 className="theme-heading font-display text-3xl">{section.name}</h2>
                  {section.description ? <p className="theme-muted mt-1 text-sm">{section.description}</p> : null}
                </div>
                <span className="theme-chip rounded-full px-3 py-1 text-xs font-bold shadow-sm">{section.items.length} {t(lang, 'products')}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {section.items.map((item) => (
                  <article key={item.id} className="menu-card animate-rise cursor-pointer" onClick={() => setSelectedItem(item)}>
                    {item.image_url ? <img src={item.image_url} alt={localizedName(item, lang)} className="h-28 w-28 rounded-lg object-cover" /> : <div className="h-28 w-28 rounded-lg" style={{ backgroundColor: 'var(--theme-chip-bg)' }} />}
                    <div className="min-w-0 flex-1">
                      <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.16em]">{categoryName(item.category_id)}</p>
                      <h3 className="theme-heading mt-1 font-display text-2xl">{localizedName(item, lang)}</h3>
                      <p className="theme-muted mt-1 line-clamp-2 text-sm">{localizedDescription(item, lang)}</p>
                      <NutritionChips item={item} lang={lang} compact />
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="theme-accent font-bold">{formatMoney(item.price, settings)}</span>
                        <QuantityControls
                          lang={lang}
                          quantity={cart[item.id]?.quantity || 0}
                          onMinus={(event) => handleQuantityClick(event, item, -1)}
                          onPlus={(event) => handleQuantityClick(event, item, 1)}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-3">
        <div className="customer-panel-strong rounded-lg border px-4 py-5 text-center shadow-soft md:px-6">
          <p className="theme-eyebrow text-[11px] font-bold uppercase tracking-[0.22em]">{table.name}</p>
          <p className="theme-heading mt-2 font-display text-2xl">{settings?.restaurant_name || 'QR Menu'}</p>
          <p className="theme-muted mt-1 text-sm">{t(lang, 'qrFooterText')}</p>
        </div>
      </footer>

      {cartLines.length > 0 ? (
        <aside className="customer-panel fixed inset-x-0 bottom-0 z-30 border-t p-3 shadow-soft backdrop-blur md:p-4">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.16em]">{t(lang, 'cart')}</p>
                <strong className="theme-heading">{t(lang, 'itemCount')(cartItemCount)}</strong>
                <span className="theme-accent text-sm font-bold">{formatMoney(total, settings)}</span>
              </div>
              <p className="theme-muted mt-1 truncate text-sm">
                {previewLines.map((line) => `${line.quantity} x ${localizedName(line.item, lang)}`).join(', ')}
                {hiddenLineCount > 0 ? `, ${t(lang, 'moreProducts')(hiddenLineCount)}` : ''}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
              <Button variant="secondary" onClick={() => setIsCartOpen(true)} className="min-h-12">
                {t(lang, 'showCart')}
              </Button>
              <Button onClick={submitOrder} className="min-h-12 px-5">
                <ShoppingBag size={18} /> {t(lang, 'order')}
              </Button>
            </div>
          </div>
          {message ? <p className="theme-heading mx-auto mt-3 max-w-5xl text-sm font-semibold">{message}</p> : null}
        </aside>
      ) : message ? (
        <div className="fixed inset-x-4 bottom-5 z-30 mx-auto max-w-md rounded-lg bg-[var(--brand-active)] px-4 py-3 text-center text-sm font-semibold text-white shadow-lift">{message}</div>
      ) : null}

      {selectedItem ? (
        <ProductDetailModal
          item={selectedItem}
          categoryName={categoryName(selectedItem.category_id)}
          settings={settings}
          quantity={cart[selectedItem.id]?.quantity || 0}
          lang={lang}
          onClose={() => setSelectedItem(null)}
          onMinus={(event) => handleQuantityClick(event, selectedItem, -1)}
          onPlus={(event) => handleQuantityClick(event, selectedItem, 1)}
        />
      ) : null}

      {isCartOpen ? (
        <CartDetailModal
          cartLines={cartLines}
          settings={settings}
          note={note}
          total={total}
          cartItemCount={cartItemCount}
          lang={lang}
          onNoteChange={setNote}
          onClose={() => setIsCartOpen(false)}
          onSubmit={submitOrder}
          onMinus={(event, item) => handleQuantityClick(event, item, -1)}
          onPlus={(event, item) => handleQuantityClick(event, item, 1)}
        />
      ) : null}
    </main>
  );
}

function QuantityControls({
  lang,
  quantity,
  onMinus,
  onPlus,
  compact = false,
}: {
  lang: Language;
  quantity: number;
  onMinus: (event: React.MouseEvent) => void;
  onPlus: (event: React.MouseEvent) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {quantity > 0 ? (
        <button className={`qty-btn ${compact ? 'h-7 w-7' : ''}`} onClick={onMinus} aria-label={lang === 'en' ? 'Decrease quantity' : 'Adet azalt'}>
          <Minus size={compact ? 13 : 16} />
        </button>
      ) : null}
      {quantity > 0 ? <span className="w-5 text-center text-sm font-bold">{quantity}</span> : null}
      <button className={`qty-btn qty-btn-dark ${compact ? 'h-7 w-7' : ''}`} onClick={onPlus} aria-label={lang === 'en' ? 'Increase quantity' : 'Adet artır'}>
        <Plus size={compact ? 13 : 16} />
      </button>
    </div>
  );
}

function NutritionChips({ item, lang, compact = false }: { item: MenuItem; lang: Language; compact?: boolean }) {
  const values = [
    item.calories != null ? { label: t(lang, 'calories'), value: `${item.calories} kcal` } : null,
    item.carbs != null ? { label: t(lang, 'carbs'), value: `${item.carbs}g` } : null,
    item.protein != null ? { label: t(lang, 'protein'), value: `${item.protein}g` } : null,
    item.fat != null ? { label: t(lang, 'fat'), value: `${item.fat}g` } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (values.length === 0) return null;

  if (compact) {
    return (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {values.slice(0, 4).map((entry) => (
          <span key={entry.label} className="theme-chip rounded-full px-2 py-1 text-[11px] font-bold">
            {entry.value}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {values.map((entry) => (
        <div key={entry.label} className="theme-chip rounded-lg p-3 text-center shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{entry.label}</p>
          <p className="mt-1 font-bold">{entry.value}</p>
        </div>
      ))}
    </div>
  );
}

function ProductDetailModal({
  item,
  categoryName,
  settings,
  quantity,
  lang,
  onClose,
  onMinus,
  onPlus,
}: {
  item: MenuItem;
  categoryName: string | undefined;
  settings: RestaurantSettings | null;
  quantity: number;
  lang: Language;
  onClose: () => void;
  onMinus: (event: React.MouseEvent) => void;
  onPlus: (event: React.MouseEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/45 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-6" onClick={onClose}>
      <article className="customer-page animate-rise max-h-[92vh] w-full overflow-y-auto rounded-t-2xl shadow-soft md:max-w-2xl md:rounded-lg" onClick={(event) => event.stopPropagation()}>
        <div className="relative">
          {item.image_url ? <img src={item.image_url} alt={localizedName(item, lang)} className="h-64 w-full object-cover" /> : <div className="h-48 w-full" style={{ backgroundColor: 'var(--theme-chip-bg)' }} />}
          <button className="customer-panel absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full shadow-soft transition hover:scale-105" onClick={onClose} aria-label={lang === 'en' ? 'Close detail' : 'Detayı kapat'}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5 md:p-7">
          <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">{categoryName || t(lang, 'menu')}</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <h2 className="theme-heading font-display text-4xl leading-none">{localizedName(item, lang)}</h2>
            <strong className="theme-chip rounded-full px-4 py-2 shadow-sm">{formatMoney(item.price, settings)}</strong>
          </div>
          {localizedDescription(item, lang) ? <p className="theme-muted mt-4 text-base leading-7">{localizedDescription(item, lang)}</p> : null}
          <NutritionChips item={item} lang={lang} />
          <div className="customer-panel-strong mt-7 flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="theme-heading text-sm font-bold">{t(lang, 'addToCart')}</p>
              <p className="theme-muted text-xs">{quantity > 0 ? t(lang, 'inCart')(quantity) : t(lang, 'notInCart')}</p>
            </div>
            <QuantityControls lang={lang} quantity={quantity} onMinus={onMinus} onPlus={onPlus} />
          </div>
        </div>
      </article>
    </div>
  );
}

function CartDetailModal({
  cartLines,
  settings,
  note,
  total,
  cartItemCount,
  lang,
  onNoteChange,
  onClose,
  onSubmit,
  onMinus,
  onPlus,
}: {
  cartLines: CartLine[];
  settings: RestaurantSettings | null;
  note: string;
  total: number;
  cartItemCount: number;
  lang: Language;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onMinus: (event: React.MouseEvent, item: MenuItem) => void;
  onPlus: (event: React.MouseEvent, item: MenuItem) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/45 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-6" onClick={onClose}>
      <article className="customer-page animate-rise max-h-[88vh] w-full overflow-hidden rounded-t-2xl shadow-soft md:max-w-2xl md:rounded-lg" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b p-5 md:p-6" style={{ borderColor: 'var(--theme-border)' }}>
          <div>
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">{t(lang, 'cartDetails')}</p>
            <h2 className="theme-heading mt-1 font-display text-3xl">{t(lang, 'itemCountProduct')(cartItemCount)}</h2>
          </div>
          <button className="customer-panel grid h-10 w-10 place-items-center rounded-full shadow-sm transition hover:scale-105" onClick={onClose} aria-label={lang === 'en' ? 'Close cart' : 'Sepeti kapat'}>
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[calc(88vh-210px)] overflow-y-auto p-5 md:p-6">
          <div className="grid gap-3">
            {cartLines.map((line) => (
              <div key={line.item.id} className="customer-panel flex items-center gap-3 rounded-lg border p-3 shadow-sm">
                {line.item.image_url ? <img src={line.item.image_url} alt={localizedName(line.item, lang)} className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg" style={{ backgroundColor: 'var(--theme-chip-bg)' }} />}
                <div className="min-w-0 flex-1">
                  <p className="theme-heading truncate font-bold">{localizedName(line.item, lang)}</p>
                  <p className="theme-muted text-sm">{formatMoney(line.item.price, settings)} x {line.quantity}</p>
                </div>
                <div className="grid justify-items-end gap-2">
                  <strong className="theme-accent text-sm">{formatMoney(line.item.price * line.quantity, settings)}</strong>
                  <QuantityControls
                    lang={lang}
                    compact
                    quantity={line.quantity}
                    onMinus={(event) => onMinus(event, line.item)}
                    onPlus={(event) => onPlus(event, line.item)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Textarea placeholder={lang === 'en' ? 'Order note (optional)' : 'Sipariş notu (isteğe bağlı)'} value={note} onChange={(event) => onNoteChange(event.target.value)} className="min-h-24" />
          </div>
        </div>
        <footer className="customer-panel border-t p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.16em]">{t(lang, 'total')}</p>
              <p className="theme-accent font-display text-3xl">{formatMoney(total, settings)}</p>
            </div>
            <Button onClick={onSubmit} className="min-h-12 px-6">
              <ShoppingBag size={18} /> {t(lang, 'order')}
            </Button>
          </div>
        </footer>
      </article>
    </div>
  );
}

function CustomerPreferences({
  language,
  theme,
  onLanguageChange,
  onThemeChange,
}: {
  language: Language;
  theme: ThemeMode;
  onLanguageChange: (language: Language) => void;
  onThemeChange: (theme: ThemeMode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-white/20 bg-white/15 p-1.5 text-xs font-extrabold text-white shadow-soft backdrop-blur">
      <div className="flex rounded-md bg-white/10 p-0.5" aria-label={language === 'en' ? 'Language selection' : 'Dil seçimi'}>
        {(['tr', 'en'] as Language[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onLanguageChange(option)}
            className={`rounded px-2.5 py-1 transition ${language === option ? 'bg-white text-leaf-950' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}
            aria-pressed={language === option}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex rounded-md bg-white/10 p-0.5" aria-label={language === 'en' ? 'Theme selection' : 'Tema seçimi'}>
        <button
          type="button"
          onClick={() => onThemeChange('light')}
          className={`inline-flex items-center gap-1 rounded px-2.5 py-1 transition ${theme === 'light' ? 'bg-white text-leaf-950' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}
          aria-pressed={theme === 'light'}
        >
          <Sun size={13} /> {language === 'en' ? 'Light' : 'Aydınlık'}
        </button>
        <button
          type="button"
          onClick={() => onThemeChange('dark')}
          className={`inline-flex items-center gap-1 rounded px-2.5 py-1 transition ${theme === 'dark' ? 'bg-white text-leaf-950' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}
          aria-pressed={theme === 'dark'}
        >
          <Moon size={13} /> {language === 'en' ? 'Dark' : 'Koyu'}
        </button>
      </div>
    </div>
  );
}
