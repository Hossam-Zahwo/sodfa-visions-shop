SODFA source final fix

Database image handling:
- products table does NOT receive image_url.
- product images are inserted into product_images.
- product_images uses product_id and optional variant_id.
- Main product images and variant images are uploaded to the product-images Storage bucket.
- Stock remains enabled.
- Product SKU is automatic.
- New Variant SKU is automatic.
- Variant inherits main product data and can inherit main images.

If the old error
column "image_url" of relation "products" does not exist
still appears after replacing src, make sure the running project is using this src folder and that no older AdminPage/admin.products file is being served.
