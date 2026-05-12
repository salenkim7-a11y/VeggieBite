function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export function ordersToCsv(orders) {
  const header = [
    'Order Number',
    'Created At',
    'Customer Name',
    'Contact Number',
    'Email',
    'Fulfillment',
    'Address',
    'Payment Method',
    'Status',
    'Items',
    'Total Amount',
    'Notes',
  ];

  const rows = orders.map((o) => {
    const itemsText = (o.items || [])
      .map((i) => `${i.name} (${i.variantName}) x${i.quantity}`)
      .join(' | ');
    return [
      o.orderNumber,
      o.createdAt,
      o.customerName,
      o.contactNumber,
      o.emailAddress || '',
      o.fulfillmentMethod,
      o.deliveryAddress || '',
      o.paymentMethod,
      o.status,
      itemsText,
      o.totalAmount,
      o.notes || '',
    ].map(escapeCsvCell);
  });

  return [header.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join(
    '\n'
  );
}

export function downloadTextFile(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

