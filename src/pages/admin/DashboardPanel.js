import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeInventoryMetrics } from '../../lib/inventory';

const STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'];

function formatShortDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function pickColor(index) {
  const palette = ['#2E7D32', '#6D4C41', '#FFB74D', '#4DB6AC', '#9575CD', '#EF5350'];
  return palette[index % palette.length];
}

export default function DashboardPanel({
  business,
  products,
  orders,
  notifications,
  activityLogs,
  formatCurrency,
  nowTick,
}) {
  const fmt = (amount) => formatCurrency(amount, business.currencySymbol);

  const totalRevenueAllTime = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const now = new Date(nowTick);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalRevenueThisMonth = orders.reduce((sum, o) => {
    const created = String(o.createdAt || '');
    return created.startsWith(monthKey) ? sum + (Number(o.totalAmount) || 0) : sum;
  }, 0);

  const averageOrderValue = orders.length ? totalRevenueAllTime / orders.length : 0;

  const { inventoryValue, lowStockCount } = computeInventoryMetrics(products);

  const bestSelling = (() => {
    const map = new Map();
    for (const o of orders) {
      for (const i of o.items || []) {
        const key = `${i.productId}:${i.variantId}`;
        const prev = map.get(key) || { name: `${i.name} (${i.variantName})`, qty: 0 };
        prev.qty += Number(i.quantity) || 0;
        map.set(key, prev);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  })();

  const ordersByStatus = STATUSES.map((s) => ({
    name: s,
    value: orders.filter((o) => o.status === s).length,
  })).filter((x) => x.value > 0);

  const dailyOrderVolume = (() => {
    const map = new Map();
    for (const o of orders) {
      const d = String(o.createdAt || '').slice(0, 10);
      if (!d) continue;
      map.set(d, (map.get(d) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));
  })();

  const dailyRevenue = (() => {
    const map = new Map();
    for (const o of orders) {
      const d = String(o.createdAt || '').slice(0, 10);
      if (!d) continue;
      map.set(d, (map.get(d) || 0) + (Number(o.totalAmount) || 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, amount]) => ({ date, amount }));
  })();

  const recentSales = [...orders]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 6);

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <>
      <div className="grid3 adminStats">
        <div className="card statCard">
          <div className="muted">Total Products</div>
          <div className="statValue">{products.length}</div>
        </div>
        <div className="card statCard">
          <div className="muted">Total Orders</div>
          <div className="statValue">{orders.length}</div>
        </div>
        <div className="card statCard">
          <div className="muted">Revenue (All Time)</div>
          <div className="statValue">{fmt(totalRevenueAllTime)}</div>
        </div>
        <div className="card statCard">
          <div className="muted">Revenue (This Month)</div>
          <div className="statValue">{fmt(totalRevenueThisMonth)}</div>
        </div>
        <div className="card statCard">
          <div className="muted">Inventory Value</div>
          <div className="statValue">{fmt(inventoryValue)}</div>
        </div>
        <div className="card statCard">
          <div className="muted">Low Stock Alerts</div>
          <div className="statValue">
            {lowStockCount} {unreadCount ? <span className="muted">({unreadCount} new)</span> : null}
          </div>
        </div>
        <div className="card statCard">
          <div className="muted">Average Order Value</div>
          <div className="statValue">{fmt(averageOrderValue)}</div>
        </div>
        <div className="card statCard">
          <div className="muted">Best-selling Variant</div>
          <div className="statValue">{bestSelling[0]?.name || '—'}</div>
        </div>
        <div className="card statCard">
          <div className="muted">Live Updates</div>
          <div className="statValue smallText">{new Date(nowTick).toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="adminCharts">
        <div className="card">
          <div className="chartHead">
            <h2>Revenue Trend</h2>
            <div className="muted">Last 14 days</div>
          </div>
          <div className="chartBox">
            {dailyRevenue.length === 0 ? (
              <div className="muted">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Line type="monotone" dataKey="amount" stroke="#2E7D32" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="chartHead">
            <h2>Best-selling Products</h2>
            <div className="muted">By quantity</div>
          </div>
          <div className="chartBox">
            {bestSelling.length === 0 ? (
              <div className="muted">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bestSelling}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="qty" name="Qty" fill="#2E7D32" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="chartHead">
            <h2>Orders by Status</h2>
            <div className="muted">Distribution</div>
          </div>
          <div className="chartBox">
            {ordersByStatus.length === 0 ? (
              <div className="muted">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={ordersByStatus}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={pickColor(index)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="chartHead">
            <h2>Daily Order Volume</h2>
            <div className="muted">Last 14 days</div>
          </div>
          <div className="chartBox">
            {dailyOrderVolume.length === 0 ? (
              <div className="muted">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyOrderVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6D4C41" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid2 adminLower">
        <div className="card">
          <div className="rowBetween">
            <h2>Recent Sales</h2>
            <div className="muted">{orders.length ? 'Latest orders' : 'No orders yet'}</div>
          </div>
          <div className="stack smallTop">
            {recentSales.length === 0 ? (
              <div className="muted">No recent sales.</div>
            ) : (
              recentSales.map((o) => (
                <div key={o.id} className="rowBetween">
                  <div>
                    <div className="strong">{o.orderNumber}</div>
                    <div className="muted">{formatShortDate(o.createdAt)}</div>
                  </div>
                  <div className="strong">{fmt(o.totalAmount)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="rowBetween">
            <h2>Notifications</h2>
            <div className="muted">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</div>
          </div>
          <div className="stack smallTop">
            {(notifications || []).slice(0, 6).length === 0 ? (
              <div className="muted">No notifications.</div>
            ) : (
              (notifications || []).slice(0, 6).map((n) => (
                <div key={n.id} className={`note ${n.read ? '' : 'unread'}`}>
                  <div className="strong">{n.title || n.type}</div>
                  <div className="muted">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="rowBetween">
            <h2>Activity Logs</h2>
            <div className="muted">Latest actions</div>
          </div>
          <div className="stack smallTop">
            {(activityLogs || []).slice(0, 10).length === 0 ? (
              <div className="muted">No activity yet.</div>
            ) : (
              (activityLogs || []).slice(0, 10).map((a) => (
                <div key={a.id} className="rowBetween">
                  <div>
                    <div className="strong">{a.type}</div>
                    <div className="muted">{a.message}</div>
                  </div>
                  <div className="muted">{formatShortDate(a.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

