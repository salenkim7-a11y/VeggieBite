import { useMemo } from 'react';
import { formatCurrency } from '../lib/currency';

function QtyPill({ value, onChange, disabled }) {
  return (
    <div className={`qtyPill ${disabled ? 'disabled' : ''}`}>
      <button
        className="qtyBtn"
        onClick={() => onChange(Math.max(0, (Number(value) || 0) - 1))}
        disabled={disabled || value <= 0}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        className="qtyInput"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        disabled={disabled}
        aria-label="Quantity"
      />
      <button
        className="qtyBtn"
        onClick={() => onChange(Math.min(99, (Number(value) || 0) + 1))}
        disabled={disabled}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default function ProductCard({ business, product, cartLine, setCartQuantity }) {
  const currencySymbol = business.currencySymbol;

  const inStock = useMemo(() => product.variants.some((v) => v.inStock), [product]);

  return (
    <article className={`productCard ${inStock ? '' : 'outOfStock'}`}>
      {product.image ? (
        <img
          className="productImage"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      ) : null}

      <div className="productTop">
        <div className="productMeta">
          <div className="productCategory">{product.category}</div>
          <h3 className="productName">{product.name}</h3>
        </div>
        <div className="productBadges">
          {(product.badges || []).map((b) => (
            <span key={b} className="badge">
              {b}
            </span>
          ))}
          {!inStock ? <span className="badge danger">Out of stock</span> : null}
        </div>
      </div>

      <p className="productDesc">{product.description}</p>

      <div className="variantList">
        {product.variants.map((variant) => {
          const qty = Number(cartLine?.[variant.id] || 0);
          const disabled = !variant.inStock;
          return (
            <div key={variant.id} className={`variantRow ${disabled ? 'disabled' : ''}`}>
              <div className="variantName">
                <div className="strong">{variant.name}</div>
                <div className="muted">{formatCurrency(variant.price, currencySymbol)}</div>
              </div>
              <QtyPill
                value={qty}
                disabled={disabled}
                onChange={(next) => setCartQuantity(product.id, variant.id, next)}
              />
              <button
                className="btn"
                disabled={disabled}
                onClick={() => setCartQuantity(product.id, variant.id, Math.max(1, qty || 0))}
              >
                Add
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
