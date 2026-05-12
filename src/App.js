import './App.css';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { BUSINESS } from './config/business';
import { PRODUCTS } from './data/products';
import { formatCurrency } from './lib/currency';
import {
  loadFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from './lib/storage';
import HomePage from './pages/HomePage';

const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function normalizeLoadedProducts(list) {
  const products = Array.isArray(list) ? list : [];
  return products.map((p) => ({
    ...p,
    badges: Array.isArray(p.badges) ? p.badges : [],
    variants: (Array.isArray(p.variants) ? p.variants : []).map((v) => {
      const price = Number(v.price ?? 0) || 0;
      const stockQty = Number(v.stockQty);
      const nextStock = Number.isFinite(stockQty) ? Math.max(0, stockQty) : 30;
      const lowStockThreshold = Number(v.lowStockThreshold);
      const nextThreshold = Number.isFinite(lowStockThreshold) ? Math.max(0, lowStockThreshold) : 5;
      const cost = Number(v.cost);
      const nextCost = Number.isFinite(cost) && cost >= 0 ? cost : Math.max(0, price * 0.5);
      return {
        ...v,
        sku: v.sku || '',
        barcode: v.barcode || '',
        cost: nextCost,
        stockQty: nextStock,
        lowStockThreshold: nextThreshold,
        inStock: nextStock > 0,
      };
    }),
  }));
}

function App() {
  const [page, setPage] = useState(() => {
    const hash = (window.location.hash || '').replace('#', '');
    if (!hash) return 'home';
    if (['home', 'products', 'checkout', 'admin'].includes(hash)) return hash;
    return 'home';
  });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [theme, setTheme] = useState(() => loadFromStorage(STORAGE_KEYS.theme, 'light'));

  useEffect(() => {
    const preload = () => {
      import('./pages/ProductsPage');
      import('./pages/CheckoutPage');
      import('./pages/AdminPage');
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(preload, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(preload, 1200);
    return () => window.clearTimeout(id);
  }, []);

  const [products, setProducts] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.products, null);
    return normalizeLoadedProducts(stored || PRODUCTS);
  });
  const [stockMovements, setStockMovements] = useState(() =>
    loadFromStorage(STORAGE_KEYS.stockMovements, [])
  );
  const [activityLogs, setActivityLogs] = useState(() =>
    loadFromStorage(STORAGE_KEYS.activityLogs, [])
  );
  const [suppliers, setSuppliers] = useState(() =>
    loadFromStorage(STORAGE_KEYS.suppliers, [])
  );
  const [warehouses, setWarehouses] = useState(() =>
    loadFromStorage(STORAGE_KEYS.warehouses, [{ id: 'main', name: 'Main Warehouse' }])
  );
  const [notifications, setNotifications] = useState(() =>
    loadFromStorage(STORAGE_KEYS.notifications, [])
  );

  const [cart, setCart] = useState(() => loadFromStorage(STORAGE_KEYS.cart, {}));
  const [orders, setOrders] = useState(() => loadFromStorage(STORAGE_KEYS.orders, []));

  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    try {
      return window.sessionStorage.getItem(STORAGE_KEYS.adminUnlocked) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    window.location.hash = page;
    setMobileNavOpen(false);
  }, [page]);

  useEffect(() => {
    try {
      document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    } catch {
      // ignore
    }
    saveToStorage(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.products, products);
  }, [products]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.stockMovements, stockMovements);
  }, [stockMovements]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.activityLogs, activityLogs);
  }, [activityLogs]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.suppliers, suppliers);
  }, [suppliers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.warehouses, warehouses);
  }, [warehouses]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.notifications, notifications);
  }, [notifications]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.cart, cart);
  }, [cart]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.orders, orders);
  }, [orders]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEYS.adminUnlocked,
        adminUnlocked ? '1' : '0'
      );
    } catch {
      // ignore
    }
  }, [adminUnlocked]);

  const cartItems = useMemo(() => {
    const items = [];
    for (const product of products) {
      const productLine = cart[product.id];
      if (!productLine) continue;
      for (const variant of product.variants) {
        const qty = productLine[variant.id] || 0;
        if (qty <= 0) continue;
        items.push({
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          variantName: variant.name,
          unitPrice: variant.price,
          quantity: qty,
          lineTotal: variant.price * qty,
        });
      }
    }
    return items;
  }, [cart, products]);

  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, itemCount };
  }, [cartItems]);

  function setCartQuantity(productId, variantId, quantity) {
    const safeQuantity = Math.max(0, Math.min(99, Number(quantity) || 0));
    setCart((prev) => {
      const next = { ...prev };
      const productLine = { ...(next[productId] || {}) };
      if (safeQuantity <= 0) delete productLine[variantId];
      else productLine[variantId] = safeQuantity;
      if (Object.keys(productLine).length === 0) delete next[productId];
      else next[productId] = productLine;
      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  function requireAdminAccess() {
    if (adminUnlocked) return true;
    const entered = window.prompt('Enter admin password:');
    if (entered && entered === BUSINESS.adminPassword) {
      setAdminUnlocked(true);
      return true;
    }
    if (entered != null) window.alert('Incorrect password.');
    return false;
  }

  function goToAdmin() {
    if (requireAdminAccess()) setPage('admin');
  }

  function appendActivity(entry) {
    setActivityLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        ...entry,
      },
      ...prev,
    ].slice(0, 200));
  }

  function pushNotification(notification) {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        read: false,
        ...notification,
      },
      ...prev,
    ].slice(0, 200));
  }

  function createOrder(orderDraft) {
    const now = new Date();
    const orderNumber = `VB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

    const order = {
      id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
      orderNumber,
      createdAt: now.toISOString(),
      status: 'Pending',
      ...orderDraft,
      items: cartItems,
      totalAmount: cartTotals.subtotal,
    };

    setOrders((prev) => [order, ...prev]);

    const orderMovements = [];
    const lowStockNotifications = [];

    setProducts((prev) =>
      prev.map((p) => {
        const orderLines = (order.items || []).filter((i) => i.productId === p.id);
        if (orderLines.length === 0) return p;
        const nextVariants = (p.variants || []).map((v) => {
          const line = orderLines.find((l) => l.variantId === v.id);
          if (!line) return v;
          const prevStock = Number(v.stockQty ?? 0);
          const delta = -Math.max(0, Number(line.quantity) || 0);
          const nextStock = Math.max(0, prevStock + delta);
          const lowStockThreshold = Number(v.lowStockThreshold ?? 5);
          orderMovements.push({
            id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
            createdAt: now.toISOString(),
            type: 'sale',
            orderId: order.id,
            orderNumber: order.orderNumber,
            productId: p.id,
            productName: p.name,
            variantId: v.id,
            variantName: v.name,
            warehouseId: 'main',
            deltaQty: delta,
            resultingQty: nextStock,
          });
          if (nextStock <= lowStockThreshold) {
            lowStockNotifications.push({
              type: 'low_stock',
              title: 'Low stock alert',
              message: `${p.name} (${v.name}) is low on stock: ${nextStock} left.`,
              meta: { productId: p.id, variantId: v.id },
            });
          }
          return { ...v, stockQty: nextStock, inStock: nextStock > 0 };
        });
        return { ...p, variants: nextVariants };
      })
    );

    if (orderMovements.length) {
      setStockMovements((prev) => [...orderMovements, ...prev].slice(0, 500));
    }

    appendActivity({
      type: 'order_created',
      message: `New order created: ${order.orderNumber}`,
      meta: { orderId: order.id },
    });

    for (const n of lowStockNotifications) pushNotification(n);

    clearCart();
    return order;
  }

  function updateOrderStatus(orderId, status) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    appendActivity({
      type: 'order_status',
      message: `Order status updated: ${orderId} → ${status}`,
      meta: { orderId, status },
    });
  }

  function deleteOrder(orderId) {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    appendActivity({
      type: 'order_deleted',
      message: `Order deleted: ${orderId}`,
      meta: { orderId },
    });
  }

  const pageNode = (() => {
    if (page === 'home') {
      return (
        <HomePage
          business={BUSINESS}
          products={products}
          onOrderNow={() => setPage('products')}
        />
      );
    }
    if (page === 'products') {
      return (
        <ProductsPage
          business={BUSINESS}
          products={products}
          cart={cart}
          setCartQuantity={setCartQuantity}
          onCheckout={() => setPage('checkout')}
        />
      );
    }
    if (page === 'checkout') {
      return (
        <CheckoutPage
          business={BUSINESS}
          cartItems={cartItems}
          subtotal={cartTotals.subtotal}
          formatCurrency={formatCurrency}
          setCartQuantity={setCartQuantity}
          clearCart={clearCart}
          onSubmitOrder={createOrder}
          onBackToProducts={() => setPage('products')}
        />
      );
    }
    if (page === 'admin') {
      if (!adminUnlocked) {
        return (
          <div className="container">
            <div className="card">
              <h1>Admin</h1>
              <p>This page is password-protected.</p>
              <button className="btn primary" onClick={goToAdmin}>
                Unlock Admin
              </button>
            </div>
          </div>
        );
      }
      return (
        <AdminPage
          business={BUSINESS}
          orders={orders}
          products={products}
          suppliers={suppliers}
          warehouses={warehouses}
          stockMovements={stockMovements}
          activityLogs={activityLogs}
          notifications={notifications}
          formatCurrency={formatCurrency}
          onUpdateStatus={updateOrderStatus}
          onDeleteOrder={deleteOrder}
          onUpdateProducts={setProducts}
          onUpdateSuppliers={setSuppliers}
          onUpdateWarehouses={setWarehouses}
          onAddStockMovements={(movements) =>
            setStockMovements((prev) => [...movements, ...prev].slice(0, 500))
          }
          onAddActivity={appendActivity}
          onUpdateNotifications={setNotifications}
          onLock={() => setAdminUnlocked(false)}
        />
      );
    }
    return null;
  })();

  return (
    <div className="appShell">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:font-semibold focus:shadow"
      >
        Skip to content
      </a>
      <NavBar
        business={BUSINESS}
        page={page}
        onNavigate={setPage}
        cartItemCount={cartTotals.itemCount}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
        onAdminClick={goToAdmin}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />
      <main id="main" className="main" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="container pagePad">
              <div className="card">Loading…</div>
            </div>
          }
        >
          {pageNode}
        </Suspense>
      </main>
      <Footer business={BUSINESS} />
    </div>
  );
}

export default App;
