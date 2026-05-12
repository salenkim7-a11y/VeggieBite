import ProductCard from '../components/ProductCard';
import { formatCurrency } from '../lib/currency';

export default function ProductsPage({
  business,
  products,
  cart,
  setCartQuantity,
  onCheckout,
}) {
  const subtotal = products.reduce((sum, p) => {
    const line = cart[p.id];
    if (!line) return sum;
    return (
      sum +
      p.variants.reduce((s, v) => s + (Number(line[v.id] || 0) * v.price), 0)
    );
  }, 0);

  const itemCount = Object.values(cart).reduce((sum, line) => {
    return sum + Object.values(line || {}).reduce((s, q) => s + (Number(q) || 0), 0);
  }, 0);

  return (
    <div className="container pagePad">
      <div className="pageHead">
        <div>
          <h1>Products</h1>
          <p className="muted">Hover, add to cart, adjust quantity, then checkout.</p>
        </div>
        <div className="cartSummary">
          <div className="muted">Cart</div>
          <div className="strong">
            {itemCount} item{itemCount === 1 ? '' : 's'} •{' '}
            {formatCurrency(subtotal, business.currencySymbol)}
          </div>
          <button className="btn primary" disabled={itemCount === 0} onClick={onCheckout}>
            Go to Checkout
          </button>
        </div>
      </div>

      <div className="grid3 productsGrid">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            business={business}
            product={p}
            cartLine={cart[p.id] || {}}
            setCartQuantity={setCartQuantity}
          />
        ))}
      </div>
    </div>
  );
}

