import Stars from '../components/Stars';
import heroPhoto from '../assets/veggie-nachos.jpeg';
import { formatCurrency } from '../lib/currency';

function getProductMinPrice(product) {
  const prices = (product.variants || [])
    .filter((v) => typeof v.price === 'number')
    .map((v) => v.price);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export default function HomePage({ business, products = [], onOrderNow }) {
  return (
    <div>
      <section className="hero">
        <div className="container heroInner">
          <div className="heroCopy">
            <div className="pill">Fresh • Local • Veggie-powered</div>
            <h1 className="heroTitle">{business.heroHeadline}</h1>
            <p className="heroSub">{business.heroSubheadline}</p>
            <div className="heroCtas">
              <button className="btn primary" onClick={onOrderNow}>
                Order Now
              </button>
              <a className="btn ghost" href={`mailto:${business.email}`}>
                Email Us
              </a>
            </div>
            <div className="heroMeta">
              <div className="metaCard">
                <div className="metaLabel">Business Hours</div>
                <div className="strong">{business.businessHours}</div>
              </div>
              <div className="metaCard">
                <div className="metaLabel">Location</div>
                <div className="strong">{business.location}</div>
              </div>
              <div className="metaCard">
                <div className="metaLabel">Payments</div>
                <div className="strong">{business.paymentMethods.join(', ')}</div>
              </div>
            </div>
          </div>

          <div className="heroArt" aria-hidden="true">
            <img
              className="heroPhoto"
              src={heroPhoto}
              alt=""
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
            <div className="artCard">
              <div className="artTitle">Veggie Crunch Box</div>
              <div className="artRow">
                <span className="dot green" />
                <span className="muted">No-fuss snacking</span>
              </div>
              <div className="artRow">
                <span className="dot brown" />
                <span className="muted">Farmer-inspired flavors</span>
              </div>
              <div className="artRow">
                <span className="dot cream" />
                <span className="muted">Made to share</span>
              </div>
            </div>
            <div className="artGlow" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid2">
          <div className="card">
            <h2>Our Story</h2>
            <p className="lead">{business.about}</p>
          </div>
          <div className="card">
            <h2>Why Choose Us</h2>
            <ul className="list">
              {business.whyChooseUs.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sectionHead">
            <h2>Products We Offer</h2>
            <p className="muted">Healthy veggie snacks made for everyday cravings.</p>
          </div>

          <div className="grid3 offersGrid">
            {products.map((p) => {
              const minPrice = getProductMinPrice(p);
              return (
                <div key={p.id} className="card offerCard">
                  {p.image ? (
                    <img
                      className="offerImage"
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      fetchpriority="low"
                      decoding="async"
                    />
                  ) : null}
                  <div className="offerBody">
                    <div className="muted">{p.category}</div>
                    <h3 className="offerTitle">{p.name}</h3>
                    <p className="offerDesc">{p.description}</p>
                  </div>
                  <div className="offerFooter">
                    <div className="strong">
                      {minPrice == null
                        ? 'See details'
                        : `From ${formatCurrency(minPrice, business.currencySymbol)}`}
                    </div>
                    <button className="btn primary" onClick={onOrderNow}>
                      Order Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="sectionHead">
            <h2>What Customers Say</h2>
            <p className="muted">Real reviews from snack lovers.</p>
          </div>
          <div className="grid3">
            {business.testimonials.map((t) => (
              <div key={t.name} className="card testimonial">
                <Stars count={t.stars} />
                <p className="quote">“{t.quote}”</p>
                <div className="muted">— {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}