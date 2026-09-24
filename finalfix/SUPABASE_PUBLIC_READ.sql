-- SODFA: public storefront read policies
-- Run this once in Supabase SQL Editor if the public store cannot read categories/products.
-- It does NOT grant public insert/update/delete permissions.

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "public read product variants" on public.product_variants;
create policy "public read product variants"
on public.product_variants for select
to anon, authenticated
using (is_active = true);

drop policy if exists "public read product images" on public.product_images;
create policy "public read product images"
on public.product_images for select
to anon, authenticated
using (true);

-- If your product-images bucket is public, product image URLs work directly.
-- If it is private, keep it private and replace getPublicUrl in the uploader with signed URLs.
