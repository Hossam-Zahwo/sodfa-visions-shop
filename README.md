# SODFA Customer Store — Final

React + TypeScript/TSX + TanStack Start + Supabase + Tailwind CSS.

## Required environment
Copy `.env.example` to `.env` and fill the three values.

## Database
Run these files once in Supabase SQL Editor:

1. `SODFA_VARIANT_STOCK_PRICE_MIGRATION.sql` (if the current database still needs the variant schema migration).
2. `SODFA_SHIPPING_REVIEWS_MIGRATION.sql` — creates/extends shipping, orders, review request, customer review, RLS and storage rules.

## Run

```bash
npm install
npm run dev
```

The local dev server is configured for `http://localhost:8080`.

## Final flow

- Hero is responsive and fills the available viewport.
- Find-your-phone is immediately below the hero.
- Product and image sliders are full-width and auto-running.
- Checkout saves the order to Supabase before opening WhatsApp.
- Admin can change order status.
- When an order is `delivered`, Admin → Orders shows the WhatsApp review-request action.
- Each review request uses a unique expiring token.
- The customer can submit one review, rating, text and optional image.
- New reviews are hidden by default.
- Admin → Customer Reviews controls publication.
- Review pages are `noindex,nofollow`.
