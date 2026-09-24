# SODFA — Product Images & Variants Update

This update is for the second request only. The Categories/Keywords work is left separate.

## What changed

- Categories no longer have image upload or image URL fields.
- Product images are uploaded from the device only (file picker or drag & drop).
- Multiple product images are supported and one can be selected as the primary image.
- Variants are optional via a Yes/No select in Add Product.
- Each variant starts from the main product's data and can override its own name, description, price, old price, stock and SKU.
- Each variant can have its own set of uploaded images.
- Main products and variants appear in one table; variants expand underneath their main product.
- Main products and variants receive unique automatic barcodes in Supabase.

## Supabase

Run `supabase_product_variants_images.sql` in Supabase SQL Editor.

The SQL creates:
- `product_variants`
- `product_images`
- `products.barcode`
- `product-images` Storage bucket
- barcode triggers

## Important

The source ZIP supplied for this update contains the project's `src` tree rather than a full npm project (no package.json was included). The modified source is therefore packaged as a source update and should be merged into the full project you already use.

The code expects an existing Supabase Storage bucket named `product-images`; the SQL creates it automatically.
