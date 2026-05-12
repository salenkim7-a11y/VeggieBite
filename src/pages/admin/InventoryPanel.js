import { useMemo, useRef, useState } from 'react';
import { clampNumber, getCategories, getVariantCost, getVariantLowStockThreshold, getVariantStockQty } from '../../lib/inventory';
import { csvToProducts, downloadProductsCsv } from '../../lib/productsCsv';
import { downloadTextFile } from '../../lib/csv';

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function asText(v) {
  return String(v ?? '').trim();
}

function normalizeVariant(raw) {
  const stockQty = clampNumber(raw.stockQty, { min: 0, max: 1_000_000 });
  const lowStockThreshold = clampNumber(raw.lowStockThreshold ?? 5, { min: 0, max: 1_000_000 });
  const price = clampNumber(raw.price, { min: 0, max: 1_000_000 });
  const cost = clampNumber(raw.cost ?? getVariantCost(raw), { min: 0, max: 1_000_000 });
  return {
    id: asText(raw.id) || uid('variant'),
    name: asText(raw.name) || 'Variant',
    sku: asText(raw.sku),
    barcode: asText(raw.barcode),
    price,
    cost,
    stockQty,
    lowStockThreshold,
    inStock: stockQty > 0,
  };
}

function normalizeProduct(raw) {
  const variants = Array.isArray(raw.variants) && raw.variants.length ? raw.variants : [];
  return {
    id: asText(raw.id) || uid('product'),
    name: asText(raw.name) || 'New Product',
    category: asText(raw.category) || 'Uncategorized',
    description: asText(raw.description),
    image: raw.image || '',
    supplierId: asText(raw.supplierId),
    badges: Array.isArray(raw.badges) ? raw.badges.filter(Boolean).slice(0, 3) : [],
    variants: variants.map(normalizeVariant),
  };
}

function compare(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}

function sumVariantStock(product) {
  return (product.variants || []).reduce((s, v) => s + getVariantStockQty(v), 0);
}

function productInventoryValue(product) {
  return (product.variants || []).reduce((s, v) => s + getVariantStockQty(v) * getVariantCost(v), 0);
}

function productLowStockCount(product) {
  return (product.variants || []).reduce((s, v) => {
    const qty = getVariantStockQty(v);
    const threshold = getVariantLowStockThreshold(v);
    return s + (qty <= threshold ? 1 : 0);
  }, 0);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function exportStockMovementsCsv(movements) {
  const header = ['created_at', 'type', 'order_number', 'product', 'variant', 'warehouse_id', 'delta_qty', 'resulting_qty', 'note'];
  const rows = (movements || []).map((m) => [
    m.createdAt,
    m.type,
    m.orderNumber || '',
    m.productName || '',
    m.variantName || '',
    m.warehouseId || '',
    m.deltaQty ?? '',
    m.resultingQty ?? '',
    m.note || '',
  ]);
  const csv = [header.join(','), ...rows.map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
  downloadTextFile(`veggie-bite-stock-movements-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
}

function ProductEditor({ open, onClose, initial, suppliers, onSave }) {
  const [draft, setDraft] = useState(() => normalizeProduct(initial || {}));

  if (!open) return null;

  function updateField(name, value) {
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function updateVariant(variantId, patch) {
    setDraft((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((v) => (v.id === variantId ? normalizeVariant({ ...v, ...patch }) : v)),
    }));
  }

  function addVariant() {
    setDraft((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), normalizeVariant({ id: uid('variant'), name: 'New Variant', price: 0, cost: 0, stockQty: 0, lowStockThreshold: 5 })],
    }));
  }

  function deleteVariant(variantId) {
    setDraft((prev) => ({ ...prev, variants: (prev.variants || []).filter((v) => v.id !== variantId) }));
  }

  async function onPickImage(file) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateField('image', dataUrl);
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal card">
        <div className="rowBetween">
          <h2>{initial?.id ? 'Edit Product' : 'Add Product'}</h2>
          <button className="btn" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="grid2 smallTop">
          <div>
            <div className="muted">Name</div>
            <input className="input" value={draft.name} onChange={(e) => updateField('name', e.target.value)} />
          </div>
          <div>
            <div className="muted">Category</div>
            <input className="input" value={draft.category} onChange={(e) => updateField('category', e.target.value)} />
          </div>
          <div>
            <div className="muted">Supplier</div>
            <select className="input" value={draft.supplierId || ''} onChange={(e) => updateField('supplierId', e.target.value)}>
              <option value="">—</option>
              {(suppliers || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="muted">Badges (comma separated)</div>
            <input
              className="input"
              value={(draft.badges || []).join(', ')}
              onChange={(e) => updateField('badges', e.target.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 3))}
            />
          </div>
          <div className="gridSpan2">
            <div className="muted">Description</div>
            <textarea className="input" rows={3} value={draft.description} onChange={(e) => updateField('description', e.target.value)} />
          </div>
          <div className="gridSpan2">
            <div className="muted">Image</div>
            <div className="row">
              <input className="input" value={draft.image || ''} onChange={(e) => updateField('image', e.target.value)} placeholder="Image URL or data:image/..." />
              <input type="file" accept="image/*" onChange={(e) => onPickImage(e.target.files?.[0] || null)} />
            </div>
          </div>
        </div>

        <div className="hr" />

        <div className="rowBetween">
          <h3>Variants</h3>
          <button className="btn" onClick={addVariant} type="button">
            Add Variant
          </button>
        </div>

        <div className="tableWrap smallTop">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Stock</th>
                <th>Low Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(draft.variants || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    Add at least one variant.
                  </td>
                </tr>
              ) : (
                (draft.variants || []).map((v) => (
                  <tr key={v.id}>
                    <td>
                      <input className="input small" value={v.name} onChange={(e) => updateVariant(v.id, { name: e.target.value })} />
                    </td>
                    <td>
                      <input className="input small" value={v.sku || ''} onChange={(e) => updateVariant(v.id, { sku: e.target.value })} />
                    </td>
                    <td>
                      <input className="input small" value={v.barcode || ''} onChange={(e) => updateVariant(v.id, { barcode: e.target.value })} />
                    </td>
                    <td>
                      <input className="input small" inputMode="decimal" value={v.price} onChange={(e) => updateVariant(v.id, { price: e.target.value })} />
                    </td>
                    <td>
                      <input className="input small" inputMode="decimal" value={v.cost} onChange={(e) => updateVariant(v.id, { cost: e.target.value })} />
                    </td>
                    <td>
                      <input className="input small" inputMode="numeric" value={v.stockQty} onChange={(e) => updateVariant(v.id, { stockQty: e.target.value })} />
                    </td>
                    <td>
                      <input className="input small" inputMode="numeric" value={v.lowStockThreshold} onChange={(e) => updateVariant(v.id, { lowStockThreshold: e.target.value })} />
                    </td>
                    <td>
                      <button className="btn danger small" onClick={() => deleteVariant(v.id)} type="button">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rowBetween smallTop">
          <div className="muted">Changes save to localStorage on this device.</div>
          <button
            className="btn primary"
            onClick={() => onSave(normalizeProduct(draft))}
            type="button"
            disabled={(draft.variants || []).length === 0}
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPanel({
  business,
  products,
  suppliers,
  warehouses,
  stockMovements,
  formatCurrency,
  onUpdateProducts,
  onUpdateSuppliers,
  onUpdateWarehouses,
  onAddStockMovements,
  onAddActivity,
  onUpdateNotifications,
}) {
  const fmt = (amount) => formatCurrency(amount, business.currencySymbol);

  const categories = useMemo(() => getCategories(products), [products]);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all | low | out
  const [sortKey, setSortKey] = useState('name'); // name | category | stock | value | low
  const [sortDir, setSortDir] = useState('asc'); // asc | desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(() => new Set());

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitial, setEditorInitial] = useState(null);

  const [stockModal, setStockModal] = useState(null); // { productId, variantId }
  const stockDeltaRef = useRef(null);
  const stockNoteRef = useRef(null);
  const stockWarehouseRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...products];

    if (q) {
      list = list.filter((p) => {
        const hay = `${p.name} ${p.category} ${p.description} ${(p.variants || []).map((v) => `${v.name} ${v.sku || ''} ${v.barcode || ''}`).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (categoryFilter) {
      list = list.filter((p) => p.category === categoryFilter);
    }

    if (stockFilter === 'out') {
      list = list.filter((p) => sumVariantStock(p) <= 0);
    } else if (stockFilter === 'low') {
      list = list.filter((p) => productLowStockCount(p) > 0);
    }

    const keyFns = {
      name: (p) => p.name,
      category: (p) => p.category,
      stock: (p) => sumVariantStock(p),
      value: (p) => productInventoryValue(p),
      low: (p) => productLowStockCount(p),
    };

    const dir = sortDir === 'desc' ? -1 : 1;
    const fn = keyFns[sortKey] || keyFns.name;
    list.sort((a, b) => {
      const av = fn(a);
      const bv = fn(b);
      const isNum = typeof av === 'number' && typeof bv === 'number';
      return dir * (isNum ? av - bv : compare(av, bv));
    });

    return list;
  }, [products, query, categoryFilter, stockFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleSelected(productId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const allIds = paged.map((p) => p.id);
      const allSelected = allIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function openAdd() {
    setEditorInitial(null);
    setEditorOpen(true);
  }

  function openEdit(product) {
    setEditorInitial(product);
    setEditorOpen(true);
  }

  function saveProduct(product) {
    onUpdateProducts((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      const next = existing ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
      return next;
    });
    onAddActivity({ type: 'product_saved', message: `Saved product: ${product.name}`, meta: { productId: product.id } });
    setEditorOpen(false);
  }

  function deleteProduct(productId) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    onUpdateProducts((prev) => prev.filter((x) => x.id !== productId));
    onAddActivity({ type: 'product_deleted', message: `Deleted product: ${p.name}`, meta: { productId } });
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }

  function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete ${ids.length} selected product(s)?`)) return;
    onUpdateProducts((prev) => prev.filter((p) => !selected.has(p.id)));
    onAddActivity({ type: 'bulk_delete', message: `Deleted ${ids.length} products`, meta: { count: ids.length } });
    setSelected(new Set());
  }

  function bulkExportSelected() {
    const ids = new Set(selected);
    if (ids.size === 0) return;
    const subset = products.filter((p) => ids.has(p.id));
    downloadProductsCsv(subset);
    onAddActivity({
      type: 'bulk_export',
      message: `Exported ${subset.length} selected products (CSV)`,
      meta: { count: subset.length },
    });
  }

  function openAdjustStock(productId, variantId) {
    setStockModal({ productId, variantId });
    setTimeout(() => stockDeltaRef.current?.focus(), 0);
  }

  function applyStockAdjustment() {
    const modal = stockModal;
    if (!modal) return;
    const deltaQty = clampNumber(stockDeltaRef.current?.value ?? 0, { min: -1_000_000, max: 1_000_000 });
    const note = asText(stockNoteRef.current?.value);
    const warehouseId = asText(stockWarehouseRef.current?.value) || 'main';
    if (!deltaQty) return;

    const now = new Date();
    const movements = [];

    onUpdateProducts((prev) =>
      prev.map((p) => {
        if (p.id !== modal.productId) return p;
        const nextVariants = (p.variants || []).map((v) => {
          if (v.id !== modal.variantId) return v;
          const prevStock = getVariantStockQty(v);
          const nextStock = clampNumber(prevStock + deltaQty, { min: 0, max: 1_000_000 });
          const threshold = getVariantLowStockThreshold(v);
          movements.push({
            id: uid('move'),
            createdAt: now.toISOString(),
            type: 'adjust',
            productId: p.id,
            productName: p.name,
            variantId: v.id,
            variantName: v.name,
            warehouseId,
            deltaQty,
            resultingQty: nextStock,
            note,
          });
          if (nextStock <= threshold) {
            onUpdateNotifications((nprev) => [
              {
                id: uid('note'),
                createdAt: now.toISOString(),
                read: false,
                type: 'low_stock',
                title: 'Low stock alert',
                message: `${p.name} (${v.name}) is low on stock: ${nextStock} left.`,
                meta: { productId: p.id, variantId: v.id },
              },
              ...nprev,
            ].slice(0, 200));
          }
          return { ...v, stockQty: nextStock, inStock: nextStock > 0 };
        });
        return { ...p, variants: nextVariants };
      })
    );

    if (movements.length) onAddStockMovements(movements);
    onAddActivity({ type: 'stock_adjusted', message: `Adjusted stock (${deltaQty})`, meta: modal });
    setStockModal(null);
  }

  async function importProductsCsvFile(file) {
    if (!file) return;
    const text = await readFileAsText(file);
    const parsed = csvToProducts(text).map(normalizeProduct);
    if (parsed.length === 0) return;
    onUpdateProducts(parsed);
    onAddActivity({ type: 'import_products', message: `Imported ${parsed.length} products from CSV`, meta: { count: parsed.length } });
  }

  function addSupplier() {
    const name = window.prompt('Supplier name:');
    if (!name) return;
    onUpdateSuppliers((prev) => [{ id: uid('sup'), name: asText(name), contact: '' }, ...prev]);
    onAddActivity({ type: 'supplier_added', message: `Added supplier: ${name}` });
  }

  function addWarehouse() {
    const name = window.prompt('Warehouse name:');
    if (!name) return;
    onUpdateWarehouses((prev) => [{ id: uid('wh'), name: asText(name) }, ...prev]);
    onAddActivity({ type: 'warehouse_added', message: `Added warehouse: ${name}` });
  }

  return (
    <div className="stack">
      <div className="rowBetween">
        <div>
          <h2>Inventory</h2>
          <div className="muted">Products persist via localStorage on this device.</div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => downloadProductsCsv(products)} type="button">
            Export Products CSV
          </button>
          <button className="btn" onClick={() => exportStockMovementsCsv(stockMovements)} type="button">
            Export Stock Movements CSV
          </button>
          <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(e) => importProductsCsvFile(e.target.files?.[0] || null)}
            />
          </label>
          <button className="btn primary" onClick={openAdd} type="button">
            Add Product
          </button>
        </div>
      </div>

      <div className="card">
        <div className="grid3">
          <div>
            <div className="muted">Search</div>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, SKU, barcode..." />
          </div>
          <div>
            <div className="muted">Category</div>
            <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="muted">Stock</div>
            <select className="input" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>

        <div className="rowBetween smallTop">
          <div className="row">
            <button className="btn" onClick={toggleSelectAll} type="button">
              Toggle Page Select
            </button>
            <button
              className="btn"
              onClick={bulkExportSelected}
              disabled={selected.size === 0}
              type="button"
            >
              Export Selected
            </button>
            <button className="btn danger" onClick={bulkDelete} disabled={selected.size === 0} type="button">
              Delete Selected
            </button>
          </div>
          <div className="row">
            <div className="muted">Rows</div>
            <select className="input small" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value) || 10)}>
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tableWrap smallTop">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && paged.every((p) => selected.has(p.id))}
                    onChange={toggleSelectAll}
                    aria-label="Select all on page"
                  />
                </th>
                <th className="clickable" onClick={() => toggleSort('name')}>
                  Product
                </th>
                <th className="clickable" onClick={() => toggleSort('category')}>
                  Category
                </th>
                <th className="clickable" onClick={() => toggleSort('stock')}>
                  Stock
                </th>
                <th className="clickable" onClick={() => toggleSort('low')}>
                  Low Stock
                </th>
                <th className="clickable" onClick={() => toggleSort('value')}>
                  Value
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No matching products.
                  </td>
                </tr>
              ) : (
                paged.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelected(p.id)} />
                    </td>
                    <td>
                      <div className="strong">{p.name}</div>
                      <div className="muted smallText">{(p.variants || []).map((v) => v.name).join(' • ')}</div>
                    </td>
                    <td className="muted">{p.category}</td>
                    <td className="strong">{sumVariantStock(p)}</td>
                    <td className={productLowStockCount(p) ? 'warnText' : 'muted'}>{productLowStockCount(p)}</td>
                    <td className="strong">{fmt(productInventoryValue(p))}</td>
                    <td>
                      <div className="row">
                        <button className="btn small" onClick={() => openEdit(p)} type="button">
                          Edit
                        </button>
                        <button className="btn danger small" onClick={() => deleteProduct(p.id)} type="button">
                          Delete
                        </button>
                      </div>
                      <div className="stack smallTop">
                        {(p.variants || []).map((v) => (
                          <div key={v.id} className="rowBetween">
                            <div className="muted smallText">
                              {v.name} • SKU {v.sku || '—'} • Barcode {v.barcode || '—'}
                            </div>
                            <button className="btn small" onClick={() => openAdjustStock(p.id, v.id)} type="button">
                              Adjust Stock
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rowBetween smallTop">
          <div className="muted">
            Page {currentPage} / {pageCount} • {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </div>
          <div className="row">
            <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} type="button">
              Prev
            </button>
            <button className="btn" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount} type="button">
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="rowBetween">
            <h3>Suppliers</h3>
            <button className="btn" onClick={addSupplier} type="button">
              Add Supplier
            </button>
          </div>
          <div className="stack smallTop">
            {(suppliers || []).length === 0 ? (
              <div className="muted">No suppliers yet.</div>
            ) : (
              (suppliers || []).slice(0, 12).map((s) => (
                <div key={s.id} className="rowBetween">
                  <div className="strong">{s.name}</div>
                  <div className="muted smallText">{s.contact || ''}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="rowBetween">
            <h3>Warehouses</h3>
            <button className="btn" onClick={addWarehouse} type="button">
              Add Warehouse
            </button>
          </div>
          <div className="stack smallTop">
            {(warehouses || []).length === 0 ? (
              <div className="muted">No warehouses yet.</div>
            ) : (
              (warehouses || []).slice(0, 12).map((w) => (
                <div key={w.id} className="rowBetween">
                  <div className="strong">{w.name}</div>
                  <div className="muted smallText">{w.id}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ProductEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initial={editorInitial}
        suppliers={suppliers}
        onSave={saveProduct}
      />

      {stockModal ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <div className="rowBetween">
              <h2>Adjust Stock</h2>
              <button className="btn" onClick={() => setStockModal(null)} type="button">
                Close
              </button>
            </div>
            <div className="grid2 smallTop">
              <div>
                <div className="muted">Warehouse</div>
                <select className="input" ref={stockWarehouseRef} defaultValue="main">
                  {(warehouses || [{ id: 'main', name: 'Main Warehouse' }]).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="muted">Delta Qty (+/-)</div>
                <input className="input" ref={stockDeltaRef} defaultValue="0" inputMode="numeric" />
              </div>
              <div className="gridSpan2">
                <div className="muted">Note (optional)</div>
                <input className="input" ref={stockNoteRef} placeholder="e.g. Restock delivery, spoilage, recount..." />
              </div>
            </div>
            <div className="rowBetween smallTop">
              <div className="muted">Creates a stock movement entry.</div>
              <button className="btn primary" onClick={applyStockAdjustment} type="button">
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
