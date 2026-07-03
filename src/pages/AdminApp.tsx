import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { BarChart3, ChefHat, ChevronDown, ClipboardList, GripVertical, ImagePlus, LayoutDashboard, LogOut, Pencil, QrCode, Settings, Trash2, Utensils, X } from 'lucide-react';
import { Button, Card, EmptyState, Field, Input, Select, StatCard, Textarea } from '../components/ui';
import { fetchMenuData, fetchOrders, uploadImage, uploadMenuImage } from '../lib/api';
import { formatDateTime, formatMoney, makeTableCode } from '../lib/format';
import { getLanguage, t } from '../lib/i18n';
import { calculateReports } from '../lib/reports';
import { supabase } from '../lib/supabase';
import { themePresets, type ThemePreset } from '../lib/theme';
import type { Category, Language, MenuItem, Order, OrderStatus, RestaurantSettings, TableRow } from '../lib/types';
import { useApp } from '../state/AppProviders';

type Tab = 'dashboard' | 'orders' | 'menu' | 'tables' | 'reports' | 'settings';
type DateFilterMode = 'all' | 'day';
type CategoryForm = { name: string; name_en: string; description: string; description_en: string };
type MenuForm = {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  price: number;
  category_id: string;
  image_url: string;
  calories: number | null;
  carbs: number | null;
  protein: number | null;
  fat: number | null;
};
type TableForm = { name: string };
type SettingsForm = Pick<RestaurantSettings, 'restaurant_name' | 'tagline' | 'description' | 'description_en' | 'logo_url' | 'background_image_url' | 'primary_color' | 'accent_color' | 'currency' | 'font_key'>;
type DraftCategory = Category & { isNew?: boolean };
type DraftMenuItem = MenuItem & { isNew?: boolean };
type DraftTable = TableRow & { isNew?: boolean };

const fontOptions = [
  { value: 'manrope', label: 'Manrope' },
  { value: 'fraunces', label: 'Fraunces' },
  { value: 'nunito', label: 'Nunito' },
  { value: 'lora', label: 'Lora' },
  { value: 'montserrat', label: 'Montserrat' },
];

const tabs: Array<{ id: Tab; labelKey: 'dashboard' | 'orders' | 'menu' | 'tables' | 'reports' | 'settings'; icon: React.ElementType }> = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { id: 'orders', labelKey: 'orders', icon: ClipboardList },
  { id: 'menu', labelKey: 'menu', icon: Utensils },
  { id: 'tables', labelKey: 'tables', icon: QrCode },
  { id: 'reports', labelKey: 'reports', icon: BarChart3 },
  { id: 'settings', labelKey: 'settings', icon: Settings },
];

function statusLabels(language: Language): Record<OrderStatus, string> {
  return {
    new: language === 'en' ? 'New' : 'Yeni',
    preparing: language === 'en' ? 'Preparing' : 'Hazırlanıyor',
    ready: language === 'en' ? 'Ready' : 'Hazır',
    completed: language === 'en' ? 'Completed' : 'Tamamlandı',
    cancelled: language === 'en' ? 'Cancelled' : 'İptal',
  };
}

function getOrderTableName(order: Order, language: Language) {
  return order.table_name || order.tables?.name || (language === 'en' ? 'Table' : 'Masa');
}

export function AdminApp() {
  const { session, settings, refreshSettings } = useApp();
  const lang = getLanguage(settings);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function refreshAll() {
    setLoading(true);
    setLoadError('');
    try {
      const [menuData, orderData] = await Promise.all([fetchMenuData(), fetchOrders()]);
      setCategories(menuData.categories);
      setItems(menuData.items);
      setTables(menuData.tables);
      setOrders(orderData);
    } catch {
      setLoadError(t(lang, 'dataLoadError') as string);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    refreshAll();
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders().then(setOrders))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders().then(setOrders))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  if (!session) return <Navigate to="/admin/login" replace />;

  const reports = calculateReports(orders);
  const newOrders = orders.filter((order) => order.status === 'new').length;

  return (
    <main className="min-h-screen bg-cream text-ink dark:bg-leaf-950 dark:text-leaf-50">
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-leaf-100 bg-white/95 p-2 backdrop-blur dark:border-leaf-800 dark:bg-leaf-950/95 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-64 lg:border-r lg:border-t-0 lg:p-5">
        <div className="hidden lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-600 dark:text-leaf-300">{t(lang, 'admin')}</p>
          <h1 className="mt-2 font-display text-3xl text-leaf-950 dark:text-leaf-50">{settings?.restaurant_name || 'QR Menu'}</h1>
        </div>
        <nav className="grid grid-cols-6 gap-1 lg:mt-8 lg:grid-cols-1 lg:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`admin-tab ${activeTab === tab.id ? 'admin-tab-active' : ''}`}>
                <Icon size={18} />
                <span>{t(lang, tab.labelKey) as string}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="px-4 pb-28 pt-6 lg:ml-64 lg:px-8 lg:pb-10">
        <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-600 dark:text-leaf-300">{t(lang, 'adminLive')}</p>
            <h2 className="font-display text-4xl text-leaf-950 dark:text-leaf-50">{t(lang, tabs.find((tab) => tab.id === activeTab)?.labelKey || 'dashboard') as string}</h2>
          </div>
          <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
            <LogOut size={16} /> {t(lang, 'logout')}
          </Button>
        </header>

        {loading ? <p className="text-leaf-700 dark:text-leaf-300">{t(lang, 'panelLoading')}</p> : null}
        {loadError ? <EmptyState title={t(lang, 'panelLoadFailed') as string} text={loadError} /> : null}
        {!loading && !loadError ? (
          <>
            <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}><Dashboard settings={settings} orders={orders} newOrders={newOrders} reports={reports} lang={lang} /></div>
            <div className={activeTab === 'orders' ? 'block' : 'hidden'}><OrdersPanel orders={orders} settings={settings} onRefresh={refreshAll} lang={lang} /></div>
            <div className={activeTab === 'menu' ? 'block' : 'hidden'}><MenuPanel categories={categories} items={items} settings={settings} onRefresh={refreshAll} lang={lang} /></div>
            <div className={activeTab === 'tables' ? 'block' : 'hidden'}><TablesPanel tables={tables} onRefresh={refreshAll} lang={lang} /></div>
            <div className={activeTab === 'reports' ? 'block' : 'hidden'}><ReportsPanel orders={orders} tables={tables} settings={settings} lang={lang} /></div>
            <div className={activeTab === 'settings' ? 'block' : 'hidden'}><SettingsPanel settings={settings} onSaved={refreshSettings} lang={lang} /></div>
          </>
        ) : null}
        </div>
      </section>
    </main>
  );
}

function Dashboard({ settings, orders, newOrders, reports, lang }: { settings: RestaurantSettings | null; orders: Order[]; newOrders: number; reports: ReturnType<typeof calculateReports>; lang: Language }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label={lang === 'en' ? 'New orders' : 'Yeni sipariş'} value={String(newOrders)} />
        <StatCard label={t(lang, 'todayOrders') as string} value={String(reports.todayOrders)} />
        <StatCard label={t(lang, 'weeklyOrders') as string} value={String(reports.weekOrders)} tone="brass" />
        <StatCard label={t(lang, 'totalRevenue') as string} value={formatMoney(reports.revenue, settings)} tone="clay" />
      </div>
      <OrdersPanel orders={orders.slice(0, 5)} settings={settings} compact lang={lang} />
    </div>
  );
}

function OrdersPanel({ orders, settings, onRefresh, compact = false, lang }: { orders: Order[]; settings: RestaurantSettings | null; onRefresh?: () => void; compact?: boolean; lang: Language }) {
  const labels = statusLabels(lang);
  const [orderMode, setOrderMode] = useState<DateFilterMode>('day');
  const [orderDate, setOrderDate] = useState(() => getTodayDateKey());
  const filteredOrders = useMemo(
    () => compact || orderMode === 'all' ? orders : orders.filter((order) => getLocalDateKey(order.created_at) === orderDate),
    [compact, orderDate, orderMode, orders],
  );

  async function updateStatus(id: string, status: OrderStatus) {
    await supabase.from('orders').update({ status }).eq('id', id);
    onRefresh?.();
  }

  if (filteredOrders.length === 0) return (
    <div className="grid gap-4">
      {!compact ? (
        <DateFilterControls
          mode={orderMode}
          date={orderDate}
          count={filteredOrders.length}
          lang={lang}
          onModeChange={setOrderMode}
          onDateChange={setOrderDate}
        />
      ) : null}
      <EmptyState title={t(lang, 'noOrders') as string} text={t(lang, 'noOrdersText') as string} />
    </div>
  );

  return (
    <div className="grid gap-4">
      {!compact ? (
        <DateFilterControls
          mode={orderMode}
          date={orderDate}
          count={filteredOrders.length}
          lang={lang}
          onModeChange={setOrderMode}
          onDateChange={setOrderDate}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf-600 dark:text-leaf-300">{getOrderTableName(order, lang)}</p>
                <h3 className="mt-1 font-display text-2xl text-leaf-950 dark:text-leaf-50">{formatMoney(order.total_amount, settings)}</h3>
                <p className="mt-1 text-sm text-leaf-700 dark:text-leaf-300">{formatDateTime(order.created_at)}</p>
              </div>
              {!compact ? (
                <Select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}>
                  {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              ) : <span className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-bold text-leaf-800 dark:bg-leaf-900 dark:text-leaf-100">{labels[order.status]}</span>}
            </div>
            <div className="mt-4 grid gap-2">
              {(order.order_items || []).map((line) => (
                <div key={line.id} className="flex items-center justify-between rounded-lg bg-leaf-50 px-3 py-2 text-sm dark:bg-leaf-900">
                  <span>{line.quantity} x {line.item_name || line.menu_items?.name || (lang === 'en' ? 'Product' : 'Ürün')}</span>
                  <span className="font-bold">{formatMoney(line.quantity * Number(line.unit_price), settings)}</span>
                </div>
              ))}
            </div>
            {order.customer_note ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-100">{t(lang, 'note')}: {order.customer_note}</p> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

function DateFilterControls({
  mode,
  date,
  count,
  lang,
  onModeChange,
  onDateChange,
}: {
  mode: DateFilterMode;
  date: string;
  count: number;
  lang: Language;
  onModeChange: (mode: DateFilterMode) => void;
  onDateChange: (date: string) => void;
}) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthDate(date));
  const todayKey = getTodayDateKey();
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(lang), [lang]);

  function chooseDay(dateKey: string) {
    onDateChange(dateKey);
    onModeChange('day');
    setVisibleMonth(getMonthDate(dateKey));
    setDatePickerOpen(false);
  }

  function openDatePicker() {
    setVisibleMonth(getMonthDate(date));
    setDatePickerOpen((current) => !current);
  }

  return (
    <Card className="relative z-20 overflow-visible p-0">
      <div className="flex flex-col gap-4 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(247,241,226,0.72))] p-4 dark:bg-[linear-gradient(135deg,rgba(13,35,26,0.96),rgba(25,52,39,0.72))] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-600 dark:text-leaf-300">{t(lang, 'reportFilter')}</p>
          <p className="mt-1 text-sm text-leaf-700 dark:text-leaf-300">{t(lang, 'reportOrderCount')(count)}</p>
        </div>
        <div className="grid gap-2 xl:grid-cols-[auto_auto] xl:items-center">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-leaf-100 bg-white/80 p-1.5 shadow-sm backdrop-blur dark:border-leaf-800 dark:bg-leaf-950/55 sm:flex">
            <Button type="button" variant={mode === 'all' ? 'primary' : 'ghost'} onClick={() => onModeChange('all')} className="min-h-10 px-3">
              {t(lang, 'reportAll')}
            </Button>
            <Button type="button" variant={mode === 'day' && date === todayKey ? 'primary' : 'ghost'} onClick={() => chooseDay(todayKey)} className="min-h-10 px-3">
              {t(lang, 'today')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-leaf-100 bg-white/80 p-1.5 shadow-sm backdrop-blur dark:border-leaf-800 dark:bg-leaf-950/55 sm:grid-cols-[auto_auto_auto]">
            <Button type="button" variant="ghost" onClick={() => chooseDay(addDaysToDateKey(date, -1))} className="min-h-10 px-3">
              {t(lang, 'previousDay')}
            </Button>
            <div className="relative col-span-2 sm:col-span-1 sm:min-w-52">
              <button
                type="button"
                onClick={openDatePicker}
                className="h-full w-full rounded-lg border border-leaf-100 bg-white px-4 py-2 text-center shadow-sm transition hover:border-leaf-300 hover:bg-leaf-50 focus:outline-none focus:ring-4 focus:ring-leaf-100 dark:border-leaf-800 dark:bg-leaf-900 dark:hover:border-leaf-700 dark:hover:bg-leaf-800 dark:focus:ring-leaf-900"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-leaf-500 dark:text-leaf-400">{t(lang, 'selectedReportDay')}</p>
                <p className="mt-0.5 font-bold text-leaf-950 dark:text-leaf-50">{mode === 'all' ? t(lang, 'allTime') : formatReportDateLabel(date, lang)}</p>
              </button>
              {datePickerOpen ? (
                <div className="absolute left-1/2 top-[calc(100%+0.6rem)] z-50 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-leaf-100 bg-white p-4 text-left shadow-lift dark:border-leaf-800 dark:bg-leaf-950">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                      className="grid h-9 w-9 place-items-center rounded-full text-leaf-800 transition hover:bg-leaf-50 dark:text-leaf-100 dark:hover:bg-leaf-900"
                      aria-label={lang === 'en' ? 'Previous month' : 'Önceki ay'}
                    >
                      ‹
                    </button>
                    <p className="font-display text-lg font-bold text-leaf-950 dark:text-leaf-50">{formatMonthLabel(visibleMonth, lang)}</p>
                    <button
                      type="button"
                      onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                      className="grid h-9 w-9 place-items-center rounded-full text-leaf-800 transition hover:bg-leaf-50 dark:text-leaf-100 dark:hover:bg-leaf-900"
                      aria-label={lang === 'en' ? 'Next month' : 'Sonraki ay'}
                    >
                      ›
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-leaf-500 dark:text-leaf-400">
                    {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-1.5">
                    {calendarDays.map((day) => {
                      const isSelected = day.key === date && mode === 'day';
                      const isToday = day.key === todayKey;
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => chooseDay(day.key)}
                          className={`h-9 rounded-lg text-sm font-bold transition ${day.inMonth ? 'text-leaf-950 dark:text-leaf-50' : 'text-leaf-300 dark:text-leaf-700'} ${isSelected ? 'bg-[var(--brand-active)] text-white shadow-lift hover:text-white' : 'hover:bg-leaf-50 dark:hover:bg-leaf-900'} ${isToday && !isSelected ? 'ring-2 ring-[var(--accent-active)]' : ''}`}
                        >
                          {day.date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <Button type="button" variant="ghost" onClick={() => chooseDay(addDaysToDateKey(date, 1))} className="min-h-10 px-3">
              {t(lang, 'nextDay')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MenuPanel({ categories, items, settings, onRefresh, lang }: { categories: Category[]; items: MenuItem[]; settings: RestaurantSettings | null; onRefresh: () => void; lang: Language }) {
  const categoryForm = useForm<CategoryForm>({ defaultValues: getEmptyCategoryForm() });
  const menuForm = useForm<MenuForm>({ defaultValues: getEmptyMenuForm() });
  const [uploading, setUploading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DraftCategory | null>(null);
  const [editingItem, setEditingItem] = useState<DraftMenuItem | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; categoryId: string } | null>(null);
  const [draftCategories, setDraftCategories] = useState<DraftCategory[]>(categories);
  const [draftItems, setDraftItems] = useState<DraftMenuItem[]>(items);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DraftMenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  useEffect(() => {
    if (hasDraftChanges) return;
    setDraftCategories(categories);
    setDraftItems(items);
  }, [categories, items, hasDraftChanges]);

  const sortedCategories = useMemo(() => [...draftCategories].sort((a, b) => a.sort_order - b.sort_order), [draftCategories]);
  const categorySections = useMemo(
    () => [
      ...sortedCategories.map((category) => ({
        id: category.id,
        category,
        title: category.name,
        description: category.description,
        items: draftItems.filter((item) => item.category_id === category.id).sort((a, b) => a.sort_order - b.sort_order),
      })),
      {
        id: 'uncategorized',
        category: null,
        title: t(lang, 'uncategorized') as string,
        description: t(lang, 'categoryDescription') as string,
        items: draftItems.filter((item) => !item.category_id).sort((a, b) => a.sort_order - b.sort_order),
      },
    ].filter((section) => section.category || section.items.length > 0),
    [draftItems, lang, sortedCategories],
  );

  function markDraftChanged() {
    setHasDraftChanges(true);
    setDraftMessage(t(lang, 'draftUnsaved') as string);
  }

  function saveCategory(values: CategoryForm) {
    if (editingCategory) {
      setDraftCategories((current) => current.map((category) => category.id === editingCategory.id ? {
        ...category,
        name: values.name,
        name_en: values.name_en || null,
        description: values.description || null,
        description_en: values.description_en || null,
      } : category));
      cancelCategoryEdit();
      markDraftChanged();
      return;
    }

    const nextSortOrder = getNextSortOrder(draftCategories);
    const category: DraftCategory = {
      id: makeTempId('category'),
      name: values.name,
      name_en: values.name_en || null,
      description: values.description || null,
      description_en: values.description_en || null,
      sort_order: nextSortOrder,
      is_active: true,
      created_at: new Date().toISOString(),
      isNew: true,
    };
    setDraftCategories((current) => [...current, category]);
    categoryForm.reset(getEmptyCategoryForm());
    setOpenCategories((current) => ({ ...current, [category.id]: true }));
    markDraftChanged();
  }

  function startCategoryEdit(category: DraftCategory) {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      name_en: category.name_en || '',
      description: category.description || '',
      description_en: category.description_en || '',
    });
  }

  function cancelCategoryEdit() {
    setEditingCategory(null);
    categoryForm.reset(getEmptyCategoryForm());
  }

  function saveItem(values: MenuForm) {
    const selectedCategoryId = values.category_id || null;
    const movedToNewCategory = editingItem && (editingItem.category_id || '') !== (values.category_id || '');
    const sortSource = draftItems.filter((item) => (item.category_id || '') === (values.category_id || ''));
    const payload = {
      name: values.name,
      name_en: values.name_en || null,
      description: values.description,
      description_en: values.description_en || null,
      price: Number(values.price),
      category_id: selectedCategoryId,
      image_url: values.image_url || null,
      calories: values.calories || null,
      carbs: values.carbs || null,
      protein: values.protein || null,
      fat: values.fat || null,
      sort_order: editingItem && !movedToNewCategory ? editingItem.sort_order : getNextSortOrder(sortSource),
    };

    if (editingItem) {
      setDraftItems((current) => current.map((item) => item.id === editingItem.id ? { ...item, ...payload } : item));
    } else {
      setDraftItems((current) => [...current, { ...payload, id: makeTempId('item'), is_available: true, created_at: new Date().toISOString(), isNew: true } as DraftMenuItem]);
    }

    cancelEdit();
    markDraftChanged();
  }

  async function handleUpload(file?: File) {
    if (!file) return;
    setUploading(true);
    const url = await uploadMenuImage(file);
    menuForm.setValue('image_url', url);
    setUploading(false);
  }

  function toggleItem(item: DraftMenuItem) {
    setDraftItems((current) => current.map((row) => row.id === item.id ? { ...row, is_available: !row.is_available } : row));
    markDraftChanged();
  }

  function toggleCategory(category: DraftCategory) {
    setDraftCategories((current) => current.map((row) => row.id === category.id ? { ...row, is_active: !row.is_active } : row));
    markDraftChanged();
  }

  async function deleteItem(item: DraftMenuItem) {
    setDeletingItem(true);
    try {
      if (!item.isNew) {
        const { error } = await supabase.from('menu_items').delete().eq('id', item.id);
        if (error) throw error;
      }
      setDraftItems((current) => current.filter((row) => row.id !== item.id));
      if (editingItem?.id === item.id) cancelEdit();
      setDeleteTarget(null);
      setDraftMessage(lang === 'en' ? 'Product deleted.' : 'Ürün silindi.');
      if (!item.isNew) await onRefresh();
    } catch {
      setDraftMessage(lang === 'en' ? 'Product could not be deleted.' : 'Ürün silinemedi.');
    } finally {
      setDeletingItem(false);
    }
  }

  function startEdit(item: DraftMenuItem) {
    setEditingItem(item);
    menuForm.reset({
      name: item.name,
      name_en: item.name_en || '',
      description: item.description || '',
      description_en: item.description_en || '',
      price: Number(item.price),
      category_id: item.category_id || '',
      image_url: item.image_url || '',
      calories: item.calories,
      carbs: item.carbs,
      protein: item.protein,
      fat: item.fat,
    });
  }

  function cancelEdit() {
    setEditingItem(null);
    menuForm.reset(getEmptyMenuForm());
  }

  function toggleSection(id: string) {
    setOpenCategories((current) => ({ ...current, [id]: !current[id] }));
  }

  function reorderCategories(targetCategoryId: string) {
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) return;
    const reordered = withSequentialSort(moveById(sortedCategories, draggedCategoryId, targetCategoryId));
    setDraftCategories(reordered);
    setDraggedCategoryId(null);
    markDraftChanged();
  }

  function reorderItems(targetItemId: string, categoryId: string) {
    if (!draggedItem || draggedItem.categoryId !== categoryId || draggedItem.id === targetItemId) return;
    const sectionItems = draftItems.filter((item) => (item.category_id || 'uncategorized') === categoryId).sort((a, b) => a.sort_order - b.sort_order);
    const reordered = withSequentialSort(moveById(sectionItems, draggedItem.id, targetItemId));
    const reorderedMap = new Map(reordered.map((item) => [item.id, item.sort_order]));
    setDraftItems((current) => current.map((item) => reorderedMap.has(item.id) ? { ...item, sort_order: reorderedMap.get(item.id)! } : item));
    setDraggedItem(null);
    markDraftChanged();
  }

  async function saveDraftChanges() {
    setSavingDraft(true);
    setDraftMessage(t(lang, 'draftSaving') as string);
    const categoryIdMap = new Map<string, string>();

    for (const category of draftCategories) {
      if (category.isNew) {
        const { data, error } = await supabase.from('categories').insert({
          name: category.name,
          name_en: category.name_en,
          description: category.description,
          description_en: category.description_en,
          sort_order: category.sort_order,
          is_active: category.is_active,
        }).select().single();
        if (error) throw error;
        categoryIdMap.set(category.id, data.id);
      } else {
        const { error } = await supabase.from('categories').update({
          name: category.name,
          name_en: category.name_en,
          description: category.description,
          description_en: category.description_en,
          sort_order: category.sort_order,
          is_active: category.is_active,
        }).eq('id', category.id);
        if (error) throw error;
      }
    }

    for (const item of draftItems) {
      const categoryId = item.category_id ? categoryIdMap.get(item.category_id) || item.category_id : null;
      const payload = {
        name: item.name,
        name_en: item.name_en,
        description: item.description,
        description_en: item.description_en,
        price: Number(item.price),
        category_id: categoryId,
        image_url: item.image_url,
        calories: item.calories,
        carbs: item.carbs,
        protein: item.protein,
        fat: item.fat,
        sort_order: item.sort_order,
        is_available: item.is_available,
      };

      if (item.isNew) {
        const { error } = await supabase.from('menu_items').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', item.id);
        if (error) throw error;
      }
    }

    setHasDraftChanges(false);
    setDraftMessage(t(lang, 'draftSaved') as string);
    setSavingDraft(false);
    await onRefresh();
  }

  async function handleSaveDraftChanges() {
    try {
      await saveDraftChanges();
    } catch {
      setSavingDraft(false);
      setDraftMessage(t(lang, 'draftSaveError') as string);
    }
  }

  function resetDraftChanges() {
    setDraftCategories(categories);
    setDraftItems(items);
    setHasDraftChanges(false);
    setDraftMessage('');
    cancelCategoryEdit();
    cancelEdit();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.92fr)_minmax(0,1.08fr)]">
      <div className="grid gap-5">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{editingCategory ? (lang === 'en' ? 'Edit category' : 'Kategoriyi düzenle') : t(lang, 'addCategory')}</h3>
              {editingCategory ? <p className="mt-1 text-sm text-leaf-700 dark:text-leaf-300">{editingCategory.name} {lang === 'en' ? 'selected.' : 'seçildi.'}</p> : null}
            </div>
            {editingCategory ? (
              <Button type="button" variant="ghost" onClick={cancelCategoryEdit}>
                <X size={16} /> {t(lang, 'cancel')}
              </Button>
            ) : null}
          </div>
          <form className="mt-4 grid gap-4" onSubmit={categoryForm.handleSubmit(saveCategory)}>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={lang === 'en' ? 'Category name' : 'Kategori adı'}><Input required {...categoryForm.register('name')} /></Field>
              <Field label={lang === 'en' ? 'Category name (English)' : 'Kategori adı (İngilizce)'}><Input placeholder="Starters" {...categoryForm.register('name_en')} /></Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t(lang, 'description') as string}><Input {...categoryForm.register('description')} /></Field>
              <Field label={lang === 'en' ? 'Description (English)' : 'Açıklama (İngilizce)'}><Input placeholder="Light plates to share" {...categoryForm.register('description_en')} /></Field>
            </div>
            <Button type="submit" className="w-fit">{editingCategory ? (lang === 'en' ? 'Update category' : 'Kategoriyi güncelle') : t(lang, 'categoryCreated')}</Button>
          </form>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{editingItem ? t(lang, 'editProduct') : t(lang, 'addProduct')}</h3>
              {editingItem ? <p className="mt-1 text-sm text-leaf-700 dark:text-leaf-300">{editingItem.name} {lang === 'en' ? 'selected.' : 'seçildi.'}</p> : null}
            </div>
            {editingItem ? (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                <X size={16} /> {t(lang, 'cancel')}
              </Button>
            ) : null}
          </div>
          <form className="mt-4 grid gap-4" onSubmit={menuForm.handleSubmit(saveItem)}>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t(lang, 'productName') as string}><Input required {...menuForm.register('name')} /></Field>
              <Field label={lang === 'en' ? 'Product name (English)' : 'Ürün adı (İngilizce)'}><Input placeholder="Grilled Chicken Bowl" {...menuForm.register('name_en')} /></Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t(lang, 'category') as string}>
                <Select {...menuForm.register('category_id')}>
                  <option value="">{t(lang, 'uncategorized')}</option>
                  {draftCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </Field>
              <Field label={t(lang, 'price') as string}><Input type="number" step="0.01" required {...menuForm.register('price', { valueAsNumber: true })} /></Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t(lang, 'description') as string}><Textarea {...menuForm.register('description')} /></Field>
              <Field label={lang === 'en' ? 'Description (English)' : 'Açıklama (İngilizce)'}><Textarea placeholder="Grilled chicken, greens and yogurt sauce." {...menuForm.register('description_en')} /></Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t(lang, 'imageUrl') as string}><Input {...menuForm.register('image_url')} /></Field>
              <Field label={t(lang, 'fileUpload') as string} hint={uploading ? t(lang, 'uploading') as string : t(lang, 'uploadHint') as string}>
                <Input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t(lang, 'calories') as string}><Input type="number" min="0" placeholder="540" {...menuForm.register('calories', { valueAsNumber: true })} /></Field>
              <Field label={`${t(lang, 'carbs')} (g)`}><Input type="number" min="0" step="0.1" placeholder="48" {...menuForm.register('carbs', { valueAsNumber: true })} /></Field>
              <Field label={`${t(lang, 'protein')} (g)`}><Input type="number" min="0" step="0.1" placeholder="38" {...menuForm.register('protein', { valueAsNumber: true })} /></Field>
              <Field label={`${t(lang, 'fat')} (g)`}><Input type="number" min="0" step="0.1" placeholder="18" {...menuForm.register('fat', { valueAsNumber: true })} /></Field>
            </div>
            <Button type="submit" className="w-fit"><ImagePlus size={16} /> {editingItem ? t(lang, 'updateProduct') : lang === 'en' ? 'Create product' : 'Ürün oluştur'}</Button>
          </form>
        </Card>
      </div>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{t(lang, 'menuStructure')}</h3>
            <p className="mt-1 text-sm text-leaf-700 dark:text-leaf-300">{t(lang, 'menuStructureHint')}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {categorySections.map((section) => (
            <div
              key={section.id}
              draggable={Boolean(section.category)}
              onDragStart={() => section.category && setDraggedCategoryId(section.category.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => section.category && reorderCategories(section.category.id)}
              className="rounded-lg border border-leaf-100 bg-white dark:border-leaf-800 dark:bg-leaf-900"
            >
              <div className="flex items-center gap-2 p-3">
                {section.category ? <GripVertical className="cursor-grab text-leaf-500" size={18} /> : <span className="w-[18px]" />}
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => toggleSection(section.id)}>
                  <ChevronDown className={`shrink-0 text-leaf-700 transition dark:text-leaf-300 ${openCategories[section.id] ? 'rotate-180' : ''}`} size={18} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-leaf-950 dark:text-leaf-50">{section.title}</span>
                    <span className="block text-xs text-leaf-700 dark:text-leaf-300">{section.items.length} {t(lang, 'products')}{section.description ? ` / ${section.description}` : ''}</span>
                  </span>
                </button>
                {section.category ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => startCategoryEdit(section.category!)}>
                      <Pencil size={15} /> {t(lang, 'edit')}
                    </Button>
                    <Button variant={section.category.is_active ? 'secondary' : 'ghost'} onClick={() => toggleCategory(section.category!)}>
                      {section.category.is_active ? t(lang, 'active') : t(lang, 'passive')}
                    </Button>
                  </div>
                ) : null}
              </div>
              {openCategories[section.id] ? (
                <div className="grid gap-2 border-t border-leaf-100 p-3 dark:border-leaf-800">
                  {section.items.length === 0 ? <p className="rounded-lg bg-leaf-50 p-3 text-sm text-leaf-700 dark:bg-leaf-950 dark:text-leaf-300">{t(lang, 'categoryEmpty')}</p> : null}
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggedItem({ id: item.id, categoryId: section.id })}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => reorderItems(item.id, section.id)}
                      className="flex items-center gap-3 rounded-lg border border-leaf-100 bg-leaf-50/60 p-3 dark:border-leaf-800 dark:bg-leaf-950"
                    >
                      <GripVertical className="cursor-grab text-leaf-500" size={18} />
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-leaf-100 dark:bg-leaf-900" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-leaf-950 dark:text-leaf-50">{item.name}</p>
                        <p className="text-sm text-leaf-700 dark:text-leaf-300">{formatMoney(item.price, settings)}</p>
                        <NutritionSummary item={item} lang={lang} />
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="ghost" onClick={() => startEdit(item)}><Pencil size={15} /> {t(lang, 'edit')}</Button>
                        <Button variant={item.is_available ? 'secondary' : 'ghost'} onClick={() => toggleItem(item)}>{item.is_available ? t(lang, 'active') : t(lang, 'passive')}</Button>
                        <Button variant="danger" onClick={() => setDeleteTarget(item)}><Trash2 size={15} /> {lang === 'en' ? 'Delete' : 'Sil'}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {deleteTarget ? (
          <DeleteProductModal
            item={deleteTarget}
            lang={lang}
            deleting={deletingItem}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => deleteItem(deleteTarget)}
          />
        ) : null}
        <div className="sticky bottom-24 mt-5 rounded-lg border border-leaf-100 bg-white/95 p-3 shadow-soft backdrop-blur dark:border-leaf-800 dark:bg-leaf-950/95 lg:bottom-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-leaf-800 dark:text-leaf-200">{draftMessage || t(lang, 'draftStatus')}</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={resetDraftChanges} disabled={!hasDraftChanges || savingDraft}>{t(lang, 'cancel')}</Button>
              <Button onClick={handleSaveDraftChanges} disabled={!hasDraftChanges || savingDraft}>
                {savingDraft ? t(lang, 'saving') : t(lang, 'save')}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function getEmptyMenuForm(): MenuForm {
  return { name: '', name_en: '', description: '', description_en: '', price: 0, category_id: '', image_url: '', calories: null, carbs: null, protein: null, fat: null };
}

function DeleteProductModal({
  item,
  lang,
  deleting,
  onCancel,
  onConfirm,
}: {
  item: DraftMenuItem;
  lang: Language;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
      <div className="w-full max-w-md rounded-lg border border-leaf-100 bg-white p-5 shadow-lift dark:border-leaf-800 dark:bg-leaf-950">
        <div className="flex items-start gap-3">
          {item.image_url ? <img src={item.image_url} alt={item.name} className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-leaf-100 dark:bg-leaf-900" />}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">{lang === 'en' ? 'Delete product' : 'Ürünü sil'}</p>
            <h3 id="delete-product-title" className="mt-1 font-display text-2xl text-leaf-950 dark:text-leaf-50">{item.name}</h3>
            <p className="mt-2 text-sm leading-6 text-leaf-700 dark:text-leaf-300">
              {lang === 'en'
                ? 'This product will be permanently removed from the menu database. Past order history will keep its saved product name.'
                : 'Bu ürün menü veritabanından kalıcı olarak silinecek. Geçmiş siparişlerde kayıtlı ürün adı korunacak.'}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={deleting}>{lang === 'en' ? 'Cancel' : 'Vazgeç'}</Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={deleting}>
            <Trash2 size={16} /> {deleting ? (lang === 'en' ? 'Deleting...' : 'Siliniyor...') : (lang === 'en' ? 'Delete permanently' : 'Kalıcı olarak sil')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteTableModal({
  table,
  lang,
  onCancel,
  onConfirm,
}: {
  table: DraftTable;
  lang: Language;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-table-title">
      <div className="w-full max-w-md rounded-lg border border-leaf-100 bg-white p-5 shadow-lift dark:border-leaf-800 dark:bg-leaf-950">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">{lang === 'en' ? 'Delete table' : 'Masayı sil'}</p>
          <h3 id="delete-table-title" className="mt-1 font-display text-2xl text-leaf-950 dark:text-leaf-50">{table.name}</h3>
          <p className="mt-2 text-sm leading-6 text-leaf-700 dark:text-leaf-300">
            {lang === 'en'
              ? 'This table will be removed when you save changes. Past orders will keep the saved table name.'
              : 'Bu masa değişiklikleri kaydettiğinde silinecek. Geçmiş siparişlerde kayıtlı masa adı korunacak.'}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>{lang === 'en' ? 'Cancel' : 'Vazgeç'}</Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            <Trash2 size={16} /> {lang === 'en' ? 'Remove from draft' : 'Taslaktan kaldır'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getEmptyCategoryForm(): CategoryForm {
  return { name: '', name_en: '', description: '', description_en: '' };
}

function getNextSortOrder(rows: Array<{ sort_order: number }>) {
  return rows.length ? Math.max(...rows.map((row) => row.sort_order || 0)) + 1 : 1;
}

function makeTempId(prefix: string) {
  return `temp-${prefix}-${crypto.randomUUID()}`;
}

function moveById<T extends { id: string }>(rows: T[], draggedId: string, targetId: string) {
  const next = [...rows];
  const from = next.findIndex((row) => row.id === draggedId);
  const to = next.findIndex((row) => row.id === targetId);
  if (from < 0 || to < 0 || from === to) return rows;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function withSequentialSort<T extends { sort_order: number }>(rows: T[]) {
  return rows.map((row, index) => ({ ...row, sort_order: index + 1 }));
}

function NutritionSummary({ item, lang }: { item: MenuItem; lang: Language }) {
  const values = [
    item.calories != null ? `${item.calories} kcal` : null,
    item.carbs != null ? `${item.carbs}g ${lang === 'en' ? 'carbs' : 'kh'}` : null,
    item.protein != null ? `${item.protein}g ${lang === 'en' ? 'protein' : 'protein'}` : null,
    item.fat != null ? `${item.fat}g ${lang === 'en' ? 'fat' : 'yağ'}` : null,
  ].filter(Boolean);

  if (values.length === 0) return null;
  return <p className="mt-1 text-xs font-semibold text-leaf-600 dark:text-leaf-300">{values.join(' / ')}</p>;
}

function TablesPanel({ tables, onRefresh, lang }: { tables: TableRow[]; onRefresh: () => void; lang: Language }) {
  const { register, handleSubmit, reset } = useForm<TableForm>();
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [draftTables, setDraftTables] = useState<DraftTable[]>(tables);
  const [deletedTableIds, setDeletedTableIds] = useState<string[]>([]);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DraftTable | null>(null);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
  const sortedTables = useMemo(
    () => [...draftTables].sort((a, b) => a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'tr')),
    [draftTables, lang],
  );

  useEffect(() => {
    if (hasDraftChanges) return;
    setDraftTables(tables);
    setDeletedTableIds([]);
  }, [tables, hasDraftChanges]);

  useEffect(() => {
    Promise.all(
      sortedTables.map(async (table) => {
        const url = `${siteUrl}/menu/${table.table_code}`;
        return [table.id, await QRCode.toDataURL(url, { margin: 1, width: 240 })] as const;
      }),
    ).then((rows) => setQrUrls(Object.fromEntries(rows)));
  }, [sortedTables, siteUrl]);

  function markDraftChanged(message = t(lang, 'draftUnsaved') as string) {
    setHasDraftChanges(true);
    setDraftMessage(message);
  }

  function addTable(values: TableForm) {
    const name = values.name.trim();
    if (!name) return;
    const table: DraftTable = {
      id: makeTempId('table'),
      name,
      table_code: makeTableCode(name),
      is_active: true,
      created_at: new Date().toISOString(),
      isNew: true,
    };
    setDraftTables((current) => [...current, table]);
    reset({ name: '' });
    markDraftChanged(lang === 'en' ? 'New table added to draft.' : 'Yeni masa taslağa eklendi.');
  }

  function toggleDraftTable(table: DraftTable) {
    setDraftTables((current) => current.map((row) => row.id === table.id ? { ...row, is_active: !row.is_active } : row));
    markDraftChanged();
  }

  function startTableEdit(table: DraftTable) {
    setEditingTableId(table.id);
    setEditingName(table.name);
  }

  function confirmTableEdit() {
    const name = editingName.trim();
    if (!editingTableId || !name) return;
    setDraftTables((current) => current.map((table) => table.id === editingTableId ? { ...table, name } : table));
    setEditingTableId(null);
    setEditingName('');
    markDraftChanged();
  }

  function removeDraftTable(table: DraftTable) {
    setDraftTables((current) => current.filter((row) => row.id !== table.id));
    if (!table.isNew) setDeletedTableIds((current) => current.includes(table.id) ? current : [...current, table.id]);
    if (editingTableId === table.id) {
      setEditingTableId(null);
      setEditingName('');
    }
    setDeleteTarget(null);
    markDraftChanged(lang === 'en' ? 'Table removed from draft.' : 'Masa taslaktan kaldırıldı.');
  }

  async function saveTableDraft() {
    setSavingDraft(true);
    setDraftMessage(t(lang, 'draftSaving') as string);
    try {
      for (const id of deletedTableIds) {
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (error) throw error;
      }
      for (const table of draftTables) {
        if (table.isNew) {
          const { error } = await supabase.from('tables').insert({ name: table.name, table_code: table.table_code, is_active: table.is_active });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('tables').update({ name: table.name, is_active: table.is_active }).eq('id', table.id);
          if (error) throw error;
        }
      }
      setHasDraftChanges(false);
      setDeletedTableIds([]);
      setDraftMessage(t(lang, 'draftSaved') as string);
      onRefresh();
    } catch {
      setDraftMessage(t(lang, 'draftSaveError') as string);
    } finally {
      setSavingDraft(false);
    }
  }

  function renderTableActions(table: DraftTable) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={table.is_active ? 'secondary' : 'ghost'} onClick={() => toggleDraftTable(table)} className="px-3 py-2">
          {table.is_active ? t(lang, 'active') : t(lang, 'passive')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => startTableEdit(table)} className="px-3 py-2">
          <Pencil size={15} /> {t(lang, 'edit')}
        </Button>
        <Button type="button" variant="danger" onClick={() => setDeleteTarget(table)} className="px-3 py-2">
          <Trash2 size={15} /> {lang === 'en' ? 'Delete' : 'Sil'}
        </Button>
      </div>
    );
  }

  function renderEditableName(table: DraftTable, compact = false) {
    if (editingTableId !== table.id) {
      return <h3 className={`font-display text-leaf-950 dark:text-leaf-50 ${compact ? 'text-xl' : 'text-2xl'}`}>{table.name}</h3>;
    }
    return (
      <div className="grid gap-2">
        <Input value={editingName} onChange={(event) => setEditingName(event.target.value)} autoFocus />
        <div className="flex gap-2">
          <Button type="button" onClick={confirmTableEdit} className="px-3 py-2">{t(lang, 'save')}</Button>
          <Button type="button" variant="ghost" onClick={() => setEditingTableId(null)} className="px-3 py-2">{t(lang, 'cancel')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <div className="grid gap-5">
        <Card className="p-5">
          <h3 className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{t(lang, 'addTable')}</h3>
          <form className="mt-4 grid gap-3" onSubmit={handleSubmit(addTable)}>
            <Field label={lang === 'en' ? 'Table name' : 'Masa adı'}><Input placeholder={lang === 'en' ? 'Table 7' : 'Masa 7'} required {...register('name')} /></Field>
            <Button type="submit">{lang === 'en' ? 'Create QR table' : 'QR masası oluştur'}</Button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-leaf-100 pt-4 dark:border-leaf-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf-600 dark:text-leaf-300">{lang === 'en' ? 'All tables' : 'Tüm masalar'}</p>
              <p className="text-sm text-leaf-700 dark:text-leaf-300">{sortedTables.length} {t(lang, 'tables')}</p>
            </div>
            <Button type="button" onClick={saveTableDraft} disabled={!hasDraftChanges || savingDraft}>
              {savingDraft ? t(lang, 'saving') : t(lang, 'save')}
            </Button>
          </div>
          {draftMessage ? <p className="mt-3 rounded-lg bg-leaf-50 p-3 text-sm font-semibold text-leaf-800 dark:bg-leaf-900 dark:text-leaf-100">{draftMessage}</p> : null}
        </Card>

        <Card className="p-4">
          <div className="grid gap-3">
            {sortedTables.map((table) => (
              <div key={table.id} className="rounded-lg border border-leaf-100 bg-white p-3 shadow-sm dark:border-leaf-800 dark:bg-leaf-900">
                <div className="grid gap-3">
                  <div>
                    {renderEditableName(table, true)}
                    <p className="mt-1 break-all text-xs text-leaf-600 dark:text-leaf-300">{table.table_code}</p>
                  </div>
                  {renderTableActions(table)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sortedTables.map((table) => (
          <Card key={table.id} className="p-5">
            <div className="grid gap-4">
              <div>
                {renderEditableName(table)}
                <p className="mt-1 break-all text-sm text-leaf-700 dark:text-leaf-300">{siteUrl}/menu/{table.table_code}</p>
              </div>
              {renderTableActions(table)}
            </div>
            {qrUrls[table.id] ? <img src={qrUrls[table.id]} alt={`${table.name} QR`} className="mt-4 h-40 w-40 rounded-lg border border-leaf-100 bg-white p-2" /> : null}
            {qrUrls[table.id] ? <a className="mt-3 inline-block text-sm font-bold text-leaf-800 underline dark:text-leaf-200" href={qrUrls[table.id]} download={`${table.table_code}.png`}>{t(lang, 'qrDownload')}</a> : null}
          </Card>
        ))}
      </div>

      {deleteTarget ? (
        <DeleteTableModal
          table={deleteTarget}
          lang={lang}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => removeDraftTable(deleteTarget)}
        />
      ) : null}
    </div>
  );
}

function ReportsPanel({ orders, tables, settings, lang }: { orders: Order[]; tables: TableRow[]; settings: RestaurantSettings | null; lang: Language }) {
  const [reportMode, setReportMode] = useState<DateFilterMode>('day');
  const [reportDate, setReportDate] = useState(() => getTodayDateKey());
  const filteredOrders = useMemo(
    () => reportMode === 'all' ? orders : orders.filter((order) => getLocalDateKey(order.created_at) === reportDate),
    [orders, reportDate, reportMode],
  );
  const reports = useMemo(() => calculateReports(filteredOrders), [filteredOrders]);
  const tableLoadRows = useMemo(() => buildTableLoadRows(tables, filteredOrders, lang), [filteredOrders, lang, tables]);

  return (
    <div className="grid gap-5">
      <DateFilterControls
        mode={reportMode}
        date={reportDate}
        count={filteredOrders.length}
        lang={lang}
        onModeChange={setReportMode}
        onDateChange={setReportDate}
      />
      <div className="relative z-0 grid gap-4 md:grid-cols-4">
        <StatCard label={t(lang, 'averageBasket') as string} value={formatMoney(reports.averageBasket, settings)} />
        <StatCard label={t(lang, 'completed') as string} value={String(reports.completedOrders)} />
        <StatCard label={t(lang, 'cancelledRate') as string} value={`${reports.cancelledRate.toFixed(1)}%`} tone="clay" />
        <StatCard label={t(lang, 'revenue') as string} value={formatMoney(reports.revenue, settings)} tone="brass" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ReportList title={t(lang, 'bestSellers') as string} rows={reports.topProducts.map((row) => ({ label: row.name, value: t(lang, 'itemCount')(row.quantity) }))} lang={lang} />
        <ReportList title={t(lang, 'lowSellers') as string} rows={reports.lowProducts.map((row) => ({ label: row.name, value: t(lang, 'itemCount')(row.quantity) }))} lang={lang} />
        <HourlyChart rows={reports.busyHours} lang={lang} />
        <TableLoadChart rows={tableLoadRows} lang={lang} />
      </div>
    </div>
  );
}

function ReportList({ title, rows, lang }: { title: string; rows: Array<{ label: string; value: string }>; lang: Language }) {
  return (
    <Card className="p-5">
      <h3 className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{title}</h3>
      <div className="mt-4 grid gap-2">
        {rows.length ? rows.map((row) => (
          <div key={row.label} className="flex justify-between rounded-lg bg-leaf-50 px-3 py-2 text-sm dark:bg-leaf-900">
            <span>{row.label}</span><strong>{row.value}</strong>
          </div>
        )) : <p className="text-sm text-leaf-700 dark:text-leaf-300">{t(lang, 'noData')}</p>}
      </div>
    </Card>
  );
}

function HourlyChart({ rows, lang }: { rows: Array<{ hour: number; count: number }>; lang: Language }) {
  const [timeRange, setTimeRange] = useState<'00-12' | '12-24'>('12-24');
  const rangeStart = timeRange === '00-12' ? 0 : 12;
  const hours = Array.from({ length: 12 }, (_, index) => {
    const hour = rangeStart + index;
    return { hour, count: rows.find((row) => row.hour === hour)?.count || 0 };
  });
  const max = Math.max(1, ...hours.map((row) => row.count));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{t(lang, 'busyHours')}</h3>
          <p className="mt-1 text-sm text-leaf-700 dark:text-leaf-300">{lang === 'en' ? 'Orders by hour in the selected range' : 'Seçili aralıktaki saatlik sipariş adedi'}</p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-leaf-100 bg-leaf-50 p-1 dark:border-leaf-800 dark:bg-leaf-900">
          {(['00-12', '12-24'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${timeRange === range ? 'bg-[var(--brand-active)] text-white shadow-sm' : 'text-leaf-800 hover:bg-white dark:text-leaf-100 dark:hover:bg-leaf-800'}`}
            >
              {range === '00-12' ? '00:00 - 12:00' : '12:00 - 24:00'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-leaf-100 bg-leaf-50 p-4 dark:border-leaf-800 dark:bg-leaf-950">
        <div className="grid gap-3">
          {hours.map((row) => {
            const width = row.count === 0 ? 0 : Math.max(10, (row.count / max) * 100);
            return (
              <div key={row.hour} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
                <span className="rounded-full bg-white px-2 py-1 text-center text-xs font-extrabold text-leaf-800 shadow-sm dark:bg-leaf-900 dark:text-leaf-100">{String(row.hour).padStart(2, '0')}:00</span>
                <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner dark:bg-leaf-900">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-active),var(--accent-active))] transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <strong className="text-right text-sm text-leaf-950 dark:text-leaf-50">{row.count}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function TableLoadChart({ rows, lang }: { rows: Array<{ name: string; count: number }>; lang: Language }) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{t(lang, 'tableLoad')}</h3>
          <p className="mt-1 text-sm text-leaf-700 dark:text-leaf-300">{lang === 'en' ? 'Order count per table' : 'Masa başına sipariş adedi'}</p>
        </div>
        <span className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700 dark:bg-leaf-900 dark:text-leaf-200">
          {rows.length} {t(lang, 'tables')}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {rows.length ? rows.map((row) => {
          const width = row.count === 0 ? 0 : Math.max(10, (row.count / max) * 100);
          return (
            <div key={row.name} className="rounded-xl border border-leaf-100 bg-[linear-gradient(135deg,#ffffff,#f8f3e7)] p-4 shadow-sm dark:border-leaf-800 dark:bg-[linear-gradient(135deg,#10251b,#0b1812)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-display text-xl font-bold text-leaf-950 dark:text-leaf-50">{row.name}</span>
                <span className="rounded-full bg-[var(--brand-active)] px-3 py-1 text-sm font-extrabold text-white">
                  {row.count} {lang === 'en' ? 'orders' : 'sipariş'}
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner dark:bg-leaf-950">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-active),var(--accent-active))]" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        }) : <p className="text-sm text-leaf-700 dark:text-leaf-300">{t(lang, 'noData')}</p>}
      </div>
    </Card>
  );
}

function buildTableLoadRows(tables: TableRow[], orders: Order[], lang: Language) {
  const counts = new Map<string, number>();
  orders
    .filter((order) => order.status !== 'cancelled')
    .forEach((order) => {
      const key = order.table_id || order.table_code || order.table_name || order.tables?.table_code || order.tables?.name || 'unknown';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

  const rows = tables.map((table) => ({
    name: table.name,
    count: counts.get(table.id) || counts.get(table.table_code) || counts.get(table.name) || 0,
  }));

  orders
    .filter((order) => order.status !== 'cancelled')
    .forEach((order) => {
      const name = getOrderTableName(order, lang);
      if (rows.some((row) => row.name === name)) return;
      const key = order.table_id || order.table_code || order.table_name || order.tables?.table_code || order.tables?.name || 'unknown';
      rows.push({ name, count: counts.get(key) || 0 });
    });

  return rows.sort((a, b) => a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'tr'));
}

function getLocalDateKey(value: string) {
  const date = new Date(value);
  return formatDateKey(date);
}

function getTodayDateKey() {
  return formatDateKey(new Date());
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function getMonthDate(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstGridDay = new Date(firstDay);
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
  firstGridDay.setDate(firstDay.getDate() - mondayBasedOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);
    return {
      date,
      key: formatDateKey(date),
      inMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function getWeekdayLabels(lang: Language) {
  const formatter = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'tr-TR', { weekday: 'short' });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 5, 15 + index);
    return formatter.format(date).slice(0, 3);
  });
}

function formatMonthLabel(date: Date, lang: Language) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'tr-TR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatReportDateLabel(value: string, lang: Language) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function SettingsPanel({ settings, onSaved, lang }: { settings: RestaurantSettings | null; onSaved: () => void; lang: Language }) {
  const { register, handleSubmit, setValue, watch } = useForm<SettingsForm>({
    values: {
      restaurant_name: settings?.restaurant_name || '',
      tagline: settings?.tagline || '',
      description: settings?.description || '',
      description_en: settings?.description_en || '',
      logo_url: settings?.logo_url || '',
      background_image_url: settings?.background_image_url || '',
      primary_color: settings?.primary_color || '#214e38',
      accent_color: settings?.accent_color || '#c69c52',
      currency: settings?.currency || 'TRY',
      font_key: settings?.font_key || 'manrope',
    },
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const selectedPrimary = watch('primary_color');
  const selectedAccent = watch('accent_color');

  async function save(values: SettingsForm) {
    if (!settings?.id) return;
    await supabase.from('restaurant_settings').update(values).eq('id', settings.id);
    onSaved();
  }

  async function handleBrandingUpload(file: File | undefined, field: 'logo_url' | 'background_image_url') {
    if (!file || !settings?.id) return;
    const setUploading = field === 'logo_url' ? setLogoUploading : setBackgroundUploading;
    setUploading(true);
    const url = await uploadImage(file, 'branding');
    await supabase.from('restaurant_settings').update({ [field]: url }).eq('id', settings.id);
    setValue(field, url, { shouldDirty: true });
    setUploading(false);
    onSaved();
  }

  function selectTheme(theme: ThemePreset) {
    setValue('primary_color', theme.primary, { shouldDirty: true });
    setValue('accent_color', theme.accent, { shouldDirty: true });
  }

  return (
    <Card className="p-5">
      <h3 className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{t(lang, 'restaurantAndTheme')}</h3>
      <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit(save)}>
        <Field label={t(lang, 'restaurantName') as string}><Input required {...register('restaurant_name')} /></Field>
        <Field label={t(lang, 'slogan') as string}><Input {...register('tagline')} /></Field>
        <Field label={t(lang, 'logoUrl') as string}><Input {...register('logo_url')} /></Field>
        <Field label={t(lang, 'logoUpload') as string} hint={logoUploading ? t(lang, 'uploading') as string : t(lang, 'logoUploadHint') as string}>
          <Input type="file" accept="image/*" onChange={(event) => handleBrandingUpload(event.target.files?.[0], 'logo_url')} />
        </Field>
        <Field label={t(lang, 'menuBackgroundUrl') as string}><Input {...register('background_image_url')} /></Field>
        <Field label={t(lang, 'backgroundUpload') as string} hint={backgroundUploading ? t(lang, 'uploading') as string : t(lang, 'backgroundUploadHint') as string}>
          <Input type="file" accept="image/*" onChange={(event) => handleBrandingUpload(event.target.files?.[0], 'background_image_url')} />
        </Field>
        <Field label={t(lang, 'currency') as string}><Input {...register('currency')} /></Field>
        <Field label={t(lang, 'font') as string}>
          <Select {...register('font_key')}>
            {fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
          </Select>
        </Field>
        <div className="lg:col-span-2">
          <ThemePalette primary={selectedPrimary} accent={selectedAccent} onSelect={selectTheme} lang={lang} />
        </div>
        <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
          <Field label={t(lang, 'description') as string}><Textarea {...register('description')} /></Field>
          <Field label={t(lang, 'descriptionEnglish') as string}><Textarea placeholder="Seasonal plates, coffees and desserts..." {...register('description_en')} /></Field>
        </div>
        <div className="lg:col-span-2"><Button type="submit"><ChefHat size={16} /> {t(lang, 'saveSettings')}</Button></div>
      </form>
    </Card>
  );
}

function ThemePalette({
  primary,
  accent,
  onSelect,
  lang,
}: {
  primary: string;
  accent: string;
  onSelect: (theme: ThemePreset) => void;
  lang: Language;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-leaf-800 dark:text-leaf-200">{t(lang, 'themePalette')}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {themePresets.map((theme) => {
          const selected = primary?.toLowerCase() === theme.primary && accent?.toLowerCase() === theme.accent;
          return (
            <button
              key={theme.name}
              type="button"
              onClick={() => onSelect(theme)}
              className={`rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
                selected ? 'border-[var(--brand-active)] bg-leaf-50 ring-2 ring-[var(--accent-active)] dark:bg-leaf-900' : 'border-leaf-100 bg-white dark:border-leaf-800 dark:bg-leaf-950'
              }`}
            >
              <div className="grid h-14 overflow-hidden rounded-md border border-black/5 dark:border-white/10">
                <div className="flex">
                  <span className="flex-1" style={{ backgroundColor: theme.primary }} />
                  <span className="w-10" style={{ backgroundColor: theme.accent }} />
                </div>
                <div className="flex">
                  <span className="flex-1" style={{ backgroundColor: theme.darkPrimary }} />
                  <span className="w-10" style={{ backgroundColor: theme.darkAccent }} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-bold text-leaf-950 dark:text-leaf-50">{theme.name}</span>
                {selected ? <span className="rounded-full bg-[var(--brand-active)] px-2 py-0.5 text-xs font-bold text-white">{t(lang, 'active')}</span> : null}
              </div>
              <p className="mt-1 text-xs text-leaf-600 dark:text-leaf-300">{theme.primary} / {theme.accent}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
