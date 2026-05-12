import Stars from "../components/Stars";
import heroPhoto from "../assets/IMG_8402.jpeg";
import { formatCurrency } from "../lib/currency";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Container from "../components/ui/Container";
import Section from "../components/ui/Section";

function getProductMinPrice(product) {
  const prices = (product.variants || [])
    .filter((v) => typeof v.price === "number")
    .map((v) => v.price);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export default function HomePage({ business, products = [], onOrderNow }) {
  return (
    <div>
      <section className="relative overflow-hidden py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-80 w-[52rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute -bottom-40 left-1/2 h-80 w-[52rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                Fresh • Local • Veggie-powered
              </div>

              <h1 className="mt-4 text-balance text-4xl font-black tracking-tight sm:text-5xl">
                {business.heroHeadline}
              </h1>
              <p className="mt-3 max-w-xl text-pretty text-lg text-[color:var(--muted)]">
                {business.heroSubheadline}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button variant="primary" onClick={onOrderNow} type="button">
                  Order Now
                </Button>
                <Button as="a" variant="ghost" href={`mailto:${business.email}`}>
                  Email Us
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Card className="p-4">
                  <div className="text-xs font-bold tracking-wide text-[color:var(--muted)]">Business Hours</div>
                  <div className="mt-1 font-extrabold">{business.businessHours}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs font-bold tracking-wide text-[color:var(--muted)]">Location</div>
                  <div className="mt-1 font-extrabold">{business.location}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs font-bold tracking-wide text-[color:var(--muted)]">Payments</div>
                  <div className="mt-1 font-extrabold">{business.paymentMethods.join(", ")}</div>
                </Card>
              </div>
            </div>

            <div className="relative">
              <Card className="relative overflow-hidden p-0">
                <img
                  src={heroPhoto}
                  alt=""
                  aria-hidden="true"
                  className="h-[360px] w-full object-cover opacity-90 sm:h-[420px]"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-white backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
                    <span className="font-bold">Veggie Crunch Box</span>
                    <span className="text-white/80">•</span>
                    <span className="text-sm text-white/90">Made to share</span>
                  </div>
                </div>
              </Card>

              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-500/10 blur-2xl" />
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-xl font-black tracking-tight">Our Story</h2>
              <p className="mt-3 text-[color:var(--muted)] leading-relaxed">{business.about}</p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-black tracking-tight">Why Choose Us</h2>
              <ul className="mt-3 grid gap-2 text-[color:var(--muted)]">
                {business.whyChooseUs.map((w) => (
                  <li key={w} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
                    <span className="leading-relaxed">{w}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Products We Offer</h2>
              <p className="mt-1 text-[color:var(--muted)]">Healthy veggie snacks made for everyday cravings.</p>
            </div>
            <Button variant="primary" onClick={onOrderNow} type="button" className="sm:self-end">
              View Products
            </Button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const minPrice = getProductMinPrice(p);
              return (
                <Card
                  key={p.id}
                  className="group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(26,29,26,0.16)] motion-reduce:transition-none"
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                      fetchpriority="low"
                      decoding="async"
                    />
                  ) : null}

                  <div className="p-5">
                    <div className="text-xs font-bold tracking-wide text-[color:var(--muted)]">{p.category}</div>
                    <h3 className="mt-1 text-lg font-extrabold tracking-tight">{p.name}</h3>
                    <p className="mt-2 text-[color:var(--muted)] leading-relaxed">{p.description}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="font-extrabold">
                        {minPrice == null
                          ? "See details"
                          : `From ${formatCurrency(minPrice, business.currencySymbol)}`}
                      </div>
                      <Button variant="primary" onClick={onOrderNow} type="button" className="px-3 py-1.5">
                        Order
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-[color:var(--surface)]">
        <Container>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight">What Customers Say</h2>
              <p className="mt-1 text-[color:var(--muted)]">Real reviews from snack lovers.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {business.testimonials.map((t) => (
              <Card key={t.name} className="p-6">
                <Stars count={t.stars} />
                <p className="mt-3 text-pretty text-[color:var(--muted)] leading-relaxed">“{t.quote}”</p>
                <div className="mt-4 text-sm font-bold text-[color:var(--muted)]">— {t.name}</div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
}
