# Veggie Bite Snack — E‑Commerce (React)

Multi-page (state-based navigation, no router) e-commerce website implemented from the requirements in `Master-Prompt.txt`.

## Pages

- `Home` — hero, story, why choose us, testimonials
- `Products` — product cards, variants, add-to-cart, quantity controls
- `Checkout` — real-time cart computation, remove items, order form + confirmation
- `Admin` — password-protected dashboard with orders table, status updates, CSV export, analytics charts (Recharts)

## Data persistence

- Cart + orders are stored in `localStorage` on the current device/browser.

## Admin access

- Password (from `Master-Prompt.txt`): `veggiebite2026`

## Development

- `npm start`
- `npm test`
- `npm run build`

## Customize

- Business + copy: `src/config/business.js`
- Products + variants/prices: `src/data/products.js`
- Storage keys: `src/lib/storage.js`

