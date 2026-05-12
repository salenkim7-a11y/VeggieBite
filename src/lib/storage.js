export const STORAGE_KEYS = {
  cart: 'vb_cart_v1',
  orders: 'vb_orders_v1',
  products: 'vb_products_v1',
  stockMovements: 'vb_stock_movements_v1',
  activityLogs: 'vb_activity_logs_v1',
  suppliers: 'vb_suppliers_v1',
  warehouses: 'vb_warehouses_v1',
  notifications: 'vb_notifications_v1',
  theme: 'vb_theme_v1',
  adminUnlocked: 'vb_admin_unlocked_v1',
};

export function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
