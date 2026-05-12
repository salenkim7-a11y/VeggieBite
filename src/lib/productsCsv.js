import { downloadTextFile } from './csv';

function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export function productsToCsv(products) {
  const header = [
    'product_id',
    'product_name',
    'category',
    'description',
    'image',
    'badge_1',
    'badge_2',
    'badge_3',
    'supplier_id',
    'variant_id',
    'variant_name',
    'sku',
    'barcode',
    'price',
    'cost',
    'stock_qty',
    'low_stock_threshold',
  ];

  const rows = [];
  for (const p of products || []) {
    const badges = Array.isArray(p.badges) ? p.badges : [];
    const base = [
      p.id,
      p.name,
      p.category,
      p.description,
      p.image || '',
      badges[0] || '',
      badges[1] || '',
      badges[2] || '',
      p.supplierId || '',
    ];
    const variants = Array.isArray(p.variants) && p.variants.length ? p.variants : [{}];
    for (const v of variants) {
      rows.push(
        [
          ...base,
          v.id || '',
          v.name || '',
          v.sku || '',
          v.barcode || '',
          v.price ?? '',
          v.cost ?? '',
          v.stockQty ?? '',
          v.lowStockThreshold ?? '',
        ].map(escapeCsvCell)
      );
    }
  }

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function parseCsvRow(line) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

export function csvToProducts(csvText) {
  const lines = String(csvText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvRow(lines[0]).map((h) => String(h || '').trim().toLowerCase());
  const idx = (name) => header.indexOf(name);

  const byId = new Map();

  for (const line of lines.slice(1)) {
    const row = parseCsvRow(line);
    const productId = row[idx('product_id')] || '';
    const variantId = row[idx('variant_id')] || '';
    if (!productId) continue;

    const product = byId.get(productId) || {
      id: productId,
      name: row[idx('product_name')] || productId,
      category: row[idx('category')] || '',
      description: row[idx('description')] || '',
      image: row[idx('image')] || '',
      supplierId: row[idx('supplier_id')] || '',
      badges: [],
      variants: [],
    };

    const badges = [
      row[idx('badge_1')] || '',
      row[idx('badge_2')] || '',
      row[idx('badge_3')] || '',
    ].filter(Boolean);
    product.badges = badges;

    if (variantId) {
      product.variants.push({
        id: variantId,
        name: row[idx('variant_name')] || variantId,
        sku: row[idx('sku')] || '',
        barcode: row[idx('barcode')] || '',
        price: Number(row[idx('price')] || 0),
        cost: Number(row[idx('cost')] || 0),
        stockQty: Number(row[idx('stock_qty')] || 0),
        lowStockThreshold: Number(row[idx('low_stock_threshold')] || 5),
        inStock: Number(row[idx('stock_qty')] || 0) > 0,
      });
    }

    byId.set(productId, product);
  }

  return Array.from(byId.values());
}

export function downloadProductsCsv(products) {
  const csv = productsToCsv(products);
  const filename = `veggie-bite-products-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
}

