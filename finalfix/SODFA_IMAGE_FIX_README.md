SODFA — Product / Image / Bestseller Fix

Fixed in this source package:
1. Removed `best_seller` from all Supabase `products` SELECT/INSERT/UPDATE payloads.
   The database column used is `is_bestseller`.
2. The admin UI still exposes the Arabic "الأكثر مبيعًا" checkbox using the internal
   `best_seller` form/model property; it is mapped to `products.is_bestseller`.
3. Product images are NOT stored in `products.image_url`.
   Main and variant images are uploaded to Storage bucket `product-images` and
   saved in `product_images` with `product_id`, optional `variant_id`,
   `image_url`, `storage_path`, `is_primary`, and `sort_order`.
4. Storefront products are loaded from the same Supabase `products` table and
   their images from `product_images`, so saved products appear in the customer
   storefront.
5. Product stock remains `products.stock_quantity`.

Important:
- This ZIP is the corrected source package from the uploaded ZIP.
- It does not contain package.json/build tooling, because the uploaded source ZIP
  itself did not contain them. Replace the corresponding `src` folder in your
  existing SODFA project, or use these source files in the same project.
- Do NOT add `best_seller` to the `products` table unless your actual schema
  contains that column. This code uses `is_bestseller`.
