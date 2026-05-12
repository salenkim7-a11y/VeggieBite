import { useEffect, useMemo, useState } from 'react';
import DashboardPanel from './admin/DashboardPanel';
import InventoryPanel from './admin/InventoryPanel';
import { ordersToCsv, downloadTextFile } from '../lib/csv';

const STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'];

function formatShortDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function exportOrdersCsv(orders) {
  const csv = ordersToCsv(orders);
  const filename = `veggie-bite-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
}

export default function AdminPage({
  business,
  orders,
  products,
  suppliers,
  warehouses,
  stockMovements,
  activityLogs,
  notifications,
  formatCurrency,
  onUpdateStatus,
  onDeleteOrder,
  onUpdateProducts,
  onUpdateSuppliers,
  onUpdateWarehouses,
  onAddStockMovements,
  onAddActivity,
  onUpdateNotifications,
  onLock,
}) {
  const [tab, setTab] = useState('dashboard'); // dashboard | inventory | orders
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  const unreadCount = useMemo(
    () => (notifications || []).filter((n) => !n.read).length,
    [notifications]
  );

  const fmt = (amount) => formatCurrency(amount, business.currencySymbol);

  function markAllNotificationsRead() {
    onUpdateNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onAddActivity({ type: 'notifications_read', message: 'Marked all notifications as read' });
  }

  return (
    <div className="container pagePad">
      <div className="pageHead">
        <div>
          <h1>{business.adminTitle}</h1>
          <p className="muted">Dashboard, inventory, and orders persist via localStorage on this device.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => exportOrdersCsv(orders)} disabled={orders.length === 0} type="button">
            Export Orders CSV
          </button>
          <button className="btn" onClick={markAllNotificationsRead} disabled={unreadCount === 0} type="button">
            Mark Notifications Read
          </button>
          <button className="btn danger" onClick={onLock} type="button">
            Lock Admin
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')} type="button">
          Dashboard
        </button>
        <button className={`tab ${tab === 'inventory' ? 'active' : ''}`} onClick={() => setTab('inventory')} type="button">
          Inventory
        </button>
        <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')} type="button">
          Orders
        </button>
      </div>

      {tab === 'dashboard' ? (
        <DashboardPanel
          business={business}
          products={products}
          orders={orders}
          notifications={notifications}
          activityLogs={activityLogs}
          formatCurrency={formatCurrency}
          nowTick={nowTick}
        />
      ) : null}

      {tab === 'inventory' ? (
        <InventoryPanel
          business={business}
          products={products}
          suppliers={suppliers}
          warehouses={warehouses}
          stockMovements={stockMovements}
          formatCurrency={formatCurrency}
          onUpdateProducts={onUpdateProducts}
          onUpdateSuppliers={onUpdateSuppliers}
          onUpdateWarehouses={onUpdateWarehouses}
          onAddStockMovements={onAddStockMovements}
          onAddActivity={onAddActivity}
          onUpdateNotifications={onUpdateNotifications}
        />
      ) : null}

      {tab === 'orders' ? (
        <div className="card">
          <div className="rowBetween">
            <h2>Orders</h2>
            <div className="muted">
              {orders.length} order{orders.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date &amp; Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="muted">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="strong">{o.orderNumber}</td>
                      <td className="muted">{formatShortDate(o.createdAt)}</td>
                      <td>
                        <div className="strong">{o.customerName}</div>
                        <div className="muted">{o.contactNumber}</div>
                      </td>
                      <td className="muted">
                        {(o.items || []).map((i) => (
                          <div key={`${i.productId}:${i.variantId}`}>
                            {i.name} ({i.variantName}) x{i.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="strong">{fmt(o.totalAmount)}</td>
                      <td className="muted">{o.paymentMethod}</td>
                      <td className="muted">
                        <div>{o.fulfillmentMethod}</div>
                        {o.deliveryAddress ? <div>{o.deliveryAddress}</div> : null}
                      </td>
                      <td>
                        <select
                          className="input small"
                          value={o.status}
                          onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button className="btn danger small" onClick={() => onDeleteOrder(o.id)} type="button">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

