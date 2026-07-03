import type { Order, OrderItem } from './types';

export function calculateReports(orders: Order[]) {
  const completed = orders.filter((order) => order.status === 'completed');
  const todayKey = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === todayKey);
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekOrders = orders.filter((order) => new Date(order.created_at).getTime() >= weekStart);
  const revenueOrders = orders.filter((order) => order.status !== 'cancelled');
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  const hourMap = new Map<number, number>();
  const tableMap = new Map<string, number>();

  revenueOrders.forEach((order) => {
    hourMap.set(new Date(order.created_at).getHours(), (hourMap.get(new Date(order.created_at).getHours()) || 0) + 1);
    const tableName = order.table_name || order.tables?.name || 'Masa';
    tableMap.set(tableName, (tableMap.get(tableName) || 0) + 1);
    (order.order_items || []).forEach((line: OrderItem) => {
      const key = line.menu_item_id || line.item_name || line.id;
      const previous = productMap.get(key) || { name: line.item_name || line.menu_items?.name || 'Ürün', quantity: 0, revenue: 0 };
      productMap.set(key, {
        ...previous,
        quantity: previous.quantity + line.quantity,
        revenue: previous.revenue + line.quantity * Number(line.unit_price),
      });
    });
  });

  const productRows = [...productMap.values()].sort((a, b) => b.quantity - a.quantity);
  const hourRows = [...hourMap.entries()].map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour - b.hour);
  const tableRows = [...tableMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const revenue = revenueOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const cancelled = orders.filter((order) => order.status === 'cancelled').length;

  return {
    todayOrders: todayOrders.length,
    weekOrders: weekOrders.length,
    completedOrders: completed.length,
    revenue,
    averageBasket: revenueOrders.length ? revenue / revenueOrders.length : 0,
    cancelledRate: orders.length ? (cancelled / orders.length) * 100 : 0,
    topProducts: productRows.slice(0, 5),
    lowProducts: [...productRows].reverse().slice(0, 5),
    busyHours: hourRows,
    tableLoad: tableRows.slice(0, 6),
  };
}
