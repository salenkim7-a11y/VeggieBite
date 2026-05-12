export function clampNumber(value, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function getVariantStockQty(variant) {
  const qty = Number(variant?.stockQty ?? 0);
  return Number.isFinite(qty) ? qty : 0;
}

export function getVariantLowStockThreshold(variant) {
  const t = Number(variant?.lowStockThreshold ?? 5);
  return Number.isFinite(t) ? t : 5;
}

export function getVariantCost(variant) {
  const cost = Number(variant?.cost ?? NaN);
  if (Number.isFinite(cost) && cost >= 0) return cost;
  const price = Number(variant?.price ?? 0);
  return Math.max(0, price * 0.5);
}

export function computeInventoryMetrics(products) {
  let inventoryValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products || []) {
    for (const v of p.variants || []) {
      const qty = getVariantStockQty(v);
      const threshold = getVariantLowStockThreshold(v);
      inventoryValue += qty * getVariantCost(v);
      if (qty <= 0) outOfStockCount += 1;
      if (qty <= threshold) lowStockCount += 1;
    }
  }

  return { inventoryValue, lowStockCount, outOfStockCount };
}

export function getCategories(products) {
  const set = new Set();
  for (const p of products || []) {
    if (p.category) set.add(p.category);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

