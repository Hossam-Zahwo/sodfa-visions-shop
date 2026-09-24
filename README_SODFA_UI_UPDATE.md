# SODFA Product UI Update

This package updates the existing SODFA source without changing the storefront's existing visual identity or Supabase connection.

## Included UI changes

### Admin / Add Product
- Reworked product editor layout to match the supplied reference:
  - image gallery on the left
  - product preview / visibility panel
  - General / Advanced tabs
  - clean Product Details form
  - Publish action
- Existing product data fields are retained.
- Product image management:
  - upload multiple images
  - delete existing images
  - choose primary image
  - drag/drop reorder
  - move up/down controls
- Variant editor:
  - variant name/type/value
  - color
  - price / old price
  - automatic SKU + barcode
  - independent variant image gallery
  - delete/reorder/primary image
- Admin product table:
  - expandable variants
  - variant thumbnail image
  - variant name/value/SKU/barcode
  - variant image count

### Storefront
- Product variants can appear as independent product cards in `/products`.
- Clicking a variant opens the main product page with that variant selected.
- Product detail page shows:
  - variant-specific image gallery
  - variant choices with thumbnails
  - variant price
  - variant-specific add-to-cart line
  - related product variants
- Product image gallery now auto-slides every ~4.2 seconds and pauses while the customer hovers over it; manual arrows/thumbnails remain available.
- Hero section now uses the hero image as a full background with dark/gradient overlays.
- "Find Your Phone" now uses a text search instead of forcing brand/model dropdowns. It searches product names, descriptions, models, and variant values.

## Supabase SQL

Run `SODFA_UI_VARIANTS_MIGRATION.sql` in the Supabase SQL Editor before testing. It adds only the variant display fields needed by this UI if they are missing and adds indexes for ordering.

The migration does not add `products.image_url`.

## Important

The uploaded archive did not contain package.json / lockfiles; it contains the `src` project source. Therefore this ZIP intentionally preserves that same source-only structure instead of inventing a package configuration that may not match your existing project.


## Follow-up fixes / polish
- Fixed product detail loading so `/product/:slug` does not depend on loading the entire catalog/categories list first. This prevents unrelated catalog errors from sending a valid product page to the global “Try again / Go home” screen.
- Fixed the missing `ProductCard` import used by the product detail page's variant section.
- Restyled the add/edit product form to the SODFA black/purple theme with readable white/lavender text, dark inputs, visible placeholders, and purple focus states.
- Added colored product badges for offers/discounts, Best Seller, Featured, and New.
- Added a rotating product-card showcase below the Hero; products are shuffled when the catalog loads and the groups auto-advance.
- Added a compact image-only product slider directly below that showcase; it uses product images from Supabase and pauses on hover.

No new database columns or SQL are required for these follow-up changes.


## Price / Product Code Fix
- Storefront price resolution now uses the normal/current price fields only. `base_price`/`old_price` is display-only for crossed-out offer pricing and is never used as the main displayed price.
- Product SKU and barcode are now carried from Supabase into storefront product data and shown on product cards, product details, and the cart.
- Variant price resolution uses the same non-zero fallback logic.
- Existing cart lines are refreshed from the current Supabase product price/SKU/barcode when the cart loads, so an old cached `0` price is corrected.
- Re-adding an existing cart line also refreshes its current price and product codes.
- No SQL changes are required for these frontend fixes, provided the existing `products` / `product_variants` price and code columns are present as used by the current project.
