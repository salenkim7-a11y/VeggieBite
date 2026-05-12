import { useMemo, useState } from 'react';

const DEFAULT_FORM = {
  customerName: '',
  contactNumber: '',
  emailAddress: '',
  fulfillmentMethod: 'Delivery',
  deliveryAddress: '',
  paymentMethod: 'GCash',
  preferredDeliveryDate: '',
  notes: '',
};

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <div className="fieldTop">
        <span className="fieldLabel">{label}</span>
        {hint ? <span className="fieldHint">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function CartRow({ item, formatCurrency, onChangeQty, onRemove }) {
  return (
    <div className="cartRow">
      <div className="cartRowMain">
        <div className="strong">
          {item.name} <span className="muted">({item.variantName})</span>
        </div>
        <div className="muted">{formatCurrency(item.unitPrice)} each</div>
      </div>
      <div className="cartRowControls">
        <div className="qtyInline">
          <button className="btn small" onClick={() => onChangeQty(item.quantity - 1)}>
            −
          </button>
          <input
            className="input qtyInlineInput"
            value={item.quantity}
            inputMode="numeric"
            onChange={(e) => onChangeQty(e.target.value)}
          />
          <button className="btn small" onClick={() => onChangeQty(item.quantity + 1)}>
            +
          </button>
        </div>
        <div className="strong">{formatCurrency(item.lineTotal)}</div>
        <button className="btn danger small" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage({
  business,
  cartItems,
  subtotal,
  formatCurrency,
  setCartQuantity,
  clearCart,
  onSubmitOrder,
  onBackToProducts,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  const fmt = useMemo(() => (amount) => formatCurrency(amount, business.currencySymbol), [
    formatCurrency,
    business.currencySymbol,
  ]);

  const canSubmit =
    cartItems.length > 0 &&
    form.customerName.trim().length > 1 &&
    form.contactNumber.trim().length >= 7 &&
    (form.fulfillmentMethod !== 'Delivery' || form.deliveryAddress.trim().length > 5);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const order = onSubmitOrder({
      customerName: form.customerName.trim(),
      contactNumber: form.contactNumber.trim(),
      emailAddress: form.emailAddress.trim(),
      fulfillmentMethod: form.fulfillmentMethod,
      deliveryAddress: form.fulfillmentMethod === 'Delivery' ? form.deliveryAddress.trim() : '',
      paymentMethod: form.paymentMethod,
      preferredDeliveryDate: form.preferredDeliveryDate,
      notes: form.notes.trim(),
    });
    setSubmittedOrder(order);
    setForm(DEFAULT_FORM);
  }

  if (submittedOrder) {
    return (
      <div className="container pagePad">
        <div className="card">
          <h1>Order Confirmed</h1>
          <p className="lead">
            Thank you, <span className="strong">{submittedOrder.customerName}</span>! Your
            order has been received. We will contact you within 24 hours to confirm. For
            urgent orders, message us on Facebook or call {business.contactNumber}.
          </p>
          <div className="summaryGrid">
            <div className="summaryItem">
              <div className="muted">Order Number</div>
              <div className="strong">{submittedOrder.orderNumber}</div>
            </div>
            <div className="summaryItem">
              <div className="muted">Total</div>
              <div className="strong">{fmt(submittedOrder.totalAmount)}</div>
            </div>
            <div className="summaryItem">
              <div className="muted">Payment</div>
              <div className="strong">{submittedOrder.paymentMethod}</div>
            </div>
            <div className="summaryItem">
              <div className="muted">Fulfillment</div>
              <div className="strong">{submittedOrder.fulfillmentMethod}</div>
            </div>
          </div>

          <div className="hr" />
          <h2>Items</h2>
          <div className="stack">
            {submittedOrder.items.map((i) => (
              <div key={`${i.productId}:${i.variantId}`} className="rowBetween">
                <div>
                  <div className="strong">
                    {i.name} <span className="muted">({i.variantName})</span>
                  </div>
                  <div className="muted">
                    {i.quantity} × {fmt(i.unitPrice)}
                  </div>
                </div>
                <div className="strong">{fmt(i.lineTotal)}</div>
              </div>
            ))}
          </div>

          <div className="hr" />
          <div className="row">
            <button className="btn" onClick={onBackToProducts}>
              Back to Products
            </button>
            <button className="btn primary" onClick={() => setSubmittedOrder(null)}>
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container pagePad">
      <div className="pageHead">
        <div>
          <h1>Checkout</h1>
          <p className="muted">Review your cart, then submit your order.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={onBackToProducts}>
            Back to Products
          </button>
          <button className="btn danger" disabled={cartItems.length === 0} onClick={clearCart}>
            Clear Cart
          </button>
        </div>
      </div>

      <div className="checkoutGrid">
        <div className="card">
          <h2>Your Cart</h2>
          {cartItems.length === 0 ? (
            <p className="muted">Your cart is empty. Add items from the Products page.</p>
          ) : (
            <div className="stack">
              {cartItems.map((item) => (
                <CartRow
                  key={`${item.productId}:${item.variantId}`}
                  item={item}
                  formatCurrency={fmt}
                  onChangeQty={(q) => setCartQuantity(item.productId, item.variantId, q)}
                  onRemove={() => setCartQuantity(item.productId, item.variantId, 0)}
                />
              ))}
            </div>
          )}

          <div className="hr" />
          <div className="rowBetween">
            <div className="muted">Subtotal</div>
            <div className="strong">{fmt(subtotal)}</div>
          </div>
          <div className="muted smallTop">{business.shippingPolicy}</div>
        </div>

        <div className="card">
          <h2>Order Details</h2>
          <form onSubmit={submit} className="stack">
            <Field label="Full Name" hint="Required">
              <input
                className="input"
                value={form.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
              />
            </Field>

            <Field label="Contact Number" hint="Required">
              <input
                className="input"
                value={form.contactNumber}
                onChange={(e) => updateField('contactNumber', e.target.value)}
                placeholder="e.g. 09xx-xxx-xxxx"
              />
            </Field>

            <Field label="Email Address" hint="Optional">
              <input
                className="input"
                value={form.emailAddress}
                onChange={(e) => updateField('emailAddress', e.target.value)}
                placeholder="e.g. you@email.com"
              />
            </Field>

            <div className="grid2">
              <Field label="Delivery or Pick-up" hint="Required">
                <select
                  className="input"
                  value={form.fulfillmentMethod}
                  onChange={(e) => updateField('fulfillmentMethod', e.target.value)}
                >
                  <option>Delivery</option>
                  <option>Pick-up</option>
                </select>
              </Field>

              <Field label="Payment Method" hint="Required">
                <select
                  className="input"
                  value={form.paymentMethod}
                  onChange={(e) => updateField('paymentMethod', e.target.value)}
                >
                  {business.paymentMethods.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>

            {form.fulfillmentMethod === 'Delivery' ? (
              <Field label="Delivery Address" hint="Required for delivery">
                <textarea
                  className="input"
                  rows={3}
                  value={form.deliveryAddress}
                  onChange={(e) => updateField('deliveryAddress', e.target.value)}
                  placeholder="Complete address (house no., street, barangay, municipality)"
                />
              </Field>
            ) : null}

            <Field label="Preferred Delivery Date" hint="Optional">
              <input
                className="input"
                type="date"
                value={form.preferredDeliveryDate}
                onChange={(e) => updateField('preferredDeliveryDate', e.target.value)}
              />
            </Field>

            <Field label="Special Instructions / Notes" hint="Optional">
              <textarea
                className="input"
                rows={3}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Anything we should know?"
              />
            </Field>

            <button className="btn primary" disabled={!canSubmit} type="submit">
              Submit Order ({fmt(subtotal)})
            </button>
            {!canSubmit ? (
              <div className="muted smallTop">
                Fill in required details and make sure your cart has items.
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

