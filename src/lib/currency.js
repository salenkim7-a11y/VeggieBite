export function formatCurrency(amount, currencySymbol = '₱') {
  const n = Number(amount) || 0;
  return `${currencySymbol}${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

