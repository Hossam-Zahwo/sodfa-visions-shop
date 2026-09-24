# Multi-Image Upload Flow Design and Implementation

## Executive Summary  
The goal is to support **multiple images per product** in our web project using Supabase Storage and PostgreSQL, without mixing concerns between tables. Currently, adding a product with an image fails due to an outdated database trigger (`trg_sodfa_sync_product_primary_image`) trying to update a non-existent `products.image_url` column. We propose keeping **all images** in a dedicated `product_images` table (one‐to‐many relationship) and removing the legacy trigger logic. The new flow will: (1) create the product record, (2) upload each image to Supabase Storage, (3) record each image’s public URL in `product_images` with a primary-image flag and optional sort order, and (4) show a success toast. This design is aligned with best practices (e.g. the FrontKit e-commerce schema uses a separate `product_images` table with `url`, `is_primary`, and ordering fields). After implementing code changes, we will run targeted SQL (dropping the old trigger/function and adding any constraints) to finalize the schema. Finally, we’ll validate with tests for 0, 1, and many images. The report below details the current system, the issues, the proposed solution, code patches, SQL updates, test plan, and a comparison of design options.

## 1. Current System and Issue Diagnosis  
- **Existing Code Flow**: The “Add Product” page (likely a React/Next.js component) currently creates a product and attempts to upload images. It uses Supabase client calls: inserting into `products`, then uploading files via `supabase.storage.from('product-images').upload(...)`, retrieving a public URL, and inserting into `product_images` (including a `storage_path` and an `is_primary` flag). There are two upload paths: a **file-picker** (input type=file) and a **drag-and-drop** component, both funnel into the same upload logic. Uploaded images are validated (e.g. file type starts with `image/` and size <5MB) before upload. After upload, `getPublicUrl` is called to fetch the URL. Finally, a success toast is shown.
- **Database Triggers/Functions**: The database has triggers on the `product_images` and `products` tables. The key conflict is **`trg_sodfa_sync_product_primary_image`** on **`product_images`** (which calls a function `sodfa_sync_product_primary_image()`). This trigger was presumably written when `products` had an `image_url` column. Its likely behavior is (pseudocode): 
  ```sql
  CREATE FUNCTION sodfa_sync_product_primary_image() RETURNS trigger AS $$
  BEGIN
    IF NEW.is_primary THEN
      UPDATE products
      SET image_url = NEW.image_url  -- legacy column
      WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  CREATE TRIGGER trg_sodfa_sync_product_primary_image
    AFTER INSERT ON product_images
    FOR EACH ROW EXECUTE FUNCTION sodfa_sync_product_primary_image();
  ```
  Since **`products.image_url` no longer exists**, this trigger fails with the error:  
  > `column "image_url" of relation "products" does not exist`.  
- **Conflict**: The error only occurs when inserting an image. Products without images insert fine. This confirms the problem is the trigger. To fix this, we will **remove or replace** the trigger/function instead of patching code to mask it. The trigger’s purpose (syncing a primary image to the products table) is no longer needed in the new design.

## 2. Current Upload Flow (Code Paths)  
Without modifying the database, let’s outline the existing code components handling uploads. These components will be updated:

- **Product Form Component (e.g. `AddProduct.jsx/tsx`)**: Contains input fields for product data and an image uploader. Likely parts:
  - **File Picker**: An `<input type="file" multiple accept="image/*" />` with an `onChange` handler.
  - **Drag-and-Drop**: A UI area using a library (e.g. React Dropzone). Its event handlers also pass selected files to the same logic.
  - Both handlers invoke a function `handleFiles(files: File[])`.
- **`handleFiles` Function**: 
  1. Filters/validates files (type and size) – see Supabase example validation.
  2. Calls `supabase.storage.from('product-images').upload(path, file, options)` for each file.
  3. On success, uses `supabase.storage.from('product-images').getPublicUrl(path)` to get the `publicUrl`.
  4. Inserts each image record: 
     ```ts
     await supabase
       .from('product_images')
       .insert({ product_id: newProduct.id, image_url: publicUrl, storage_path: path, is_primary: (firstImage) });
     ```
- **Supabase Client File**: A file like `supabaseClient.ts` initializes the Supabase client with the project URL and anon key. It’s used throughout.
- **Types/Interfaces**: TypeScript types like `ProductInsert` and `ProductImageInsert` define the fields. We will ensure `image_url`, `storage_path`, and `is_primary` are correctly typed in `ProductImageInsert`.

All these code paths will be updated to assume **no `image_url` in `products`** and to handle multiple images consistently. In particular, any code that tried to update `products.image_url` (if it exists) will be removed.

## 3. Proposed Architecture (Unified design)  
We adopt a **single-source design**: **every product image lives in `product_images`**, including the “primary” one. The `products` table will have **no image URL column**. Key points:

- **Database Schema**:  
  - **`products` table**: id (PK), name, description, price, etc. *No image fields.*  
  - **`product_images` table**: id (PK), `product_id` (FK → products.id), `image_url` (text), `storage_path` (text), `is_primary` (boolean), and optionally `position` (integer) for ordering. This follows best practice for one-to-many images (e.g. FrontKit uses this pattern).  
  - Example (Mermaid ER diagram format):  
    ```mermaid
    erDiagram
      PRODUCTS ||--o{ PRODUCT_IMAGES : has
      PRODUCTS {
        uuid id PK "Product ID"
        text name
        ... (other product fields)
      }
      PRODUCT_IMAGES {
        uuid id PK "Image ID"
        uuid product_id FK "References PRODUCTS.id"
        text image_url "Public URL of image"
        text storage_path "Path in Storage bucket"
        bool is_primary "Primary image flag"
        int position "Display order (optional)"
      }
    ```  
    (This diagram shows a one-to-many relationship between PRODUCTS and PRODUCT_IMAGES.)
  - We may **add a unique constraint** to ensure only one image per product is marked primary. For example:  
    ```sql
    ALTER TABLE product_images
      ADD CONSTRAINT one_primary_image_per_product
      UNIQUE (product_id) 
      WHERE (is_primary);
    ```
- **Upload Sequence** (mermaid flowchart style):  
  ```mermaid
  flowchart LR
    A[Create Product Record] -->|gets new product_id| B[Upload Image 1 to Storage]
    B --> C[Get public URL (getPublicUrl)]
    C --> D[Insert PRODUCT_IMAGES record (is_primary=true)]
    A -->|product created| D
    B2[Upload Image 2..N] --> C2[Get public URL] --> D2[Insert PRODUCT_IMAGES (is_primary=false)]
    subgraph "Client/UI"
      A & B & B2 & C & C2 & D & D2
    end
    subgraph "Database"
      D & D2
    end
    B & B2 --> |files| Storage[(Supabase Storage Bucket)]
  ```  
  This shows creating the product first, then uploading each image file, fetching its URL, and inserting into `product_images` with the new product ID.

- **Frontend Flow**: 
  1. The form submits **product data only** to `supabase.from('products').insert(...)`.
  2. On success, take the returned `id` from the inserted product.  
  3. Loop over selected image files: for each, upload to Storage (`supabase.storage.from('product-images').upload('path', file)`), then retrieve the `publicUrl` (with `.getPublicUrl(path)`).  
  4. Insert a row into `product_images` with `{ product_id: id, image_url: publicUrl, storage_path: path, is_primary: (index===0) }`. Mark the first image as primary (or use any UI flag).  
  5. After all images inserted, show a success toast (e.g. “Product and images saved”).  
  6. **Error handling**: If any step fails (upload or insert), catch the error, show a toast, and optionally roll back partial work. Ideally, wrap in a transaction or handle cleanup (delete uploaded files on failure).  
  7. **On Delete**: When a product is deleted, also delete its images from Storage (using `.remove([path])`) and delete from `product_images`. Alternatively, add a DB cascade rule on delete of product.  
  8. **Display**: In the product details page, query `product_images` for the product (order by `is_primary DESC, position ASC`). Use the primary one for main display.

This unified approach avoids any special-casing. Every image is handled the same way (see Sec. 5 for code diffs).

## 4. Files to Change and Code Patches  

We identify the main files (and spots) to update. The exact paths/names depend on the codebase; adjust accordingly. 

- **Product Form Component (Add/Edit)**:  
  - *Remove any fields or logic referring to `products.image_url`.*  
  - *After inserting into `products`, use the returned id:*
    ```diff
    --- a/src/pages/AddProduct.tsx
    +++ b/src/pages/AddProduct.tsx
    @@ async function saveProduct() {
-    // Old: insert including image_url (legacy)
-    const { data: { 0: productId } } = await supabase
-      .from('products')
-      .insert([{
-        name, price, ...,
-        image_url: mainImageUrl  // remove this
-      }])
-      .select('id');
+    // Insert product (without images)
+    const { data, error: prodErr } = await supabase
+      .from('products')
+      .insert([{ name, price, /* ...other fields... */ }])
+      .select('id');
+    if (prodErr) { console.error(prodErr); throw prodErr; }
+    const productId = data[0].id;
 
-    // Old: separately handle image_url, likely not needed now
-    ...
-    // New: after creating product, loop through files:
+    // Upload each image file to Supabase Storage, then insert into product_images
+    for (let i = 0; i < files.length; i++) {
+      const file = files[i];
+      const filePath = `product-images/${productId}/${Date.now()}-${file.name}`;
+      const { data: uploadData, error: uploadErr } = await supabase
+        .storage
+        .from('product-images')
+        .upload(filePath, file);
+      if (uploadErr) { console.error(uploadErr); throw uploadErr; }
+      // Get public URL for the uploaded file
+      const { data: { publicUrl } } = supabase
+        .storage
+        .from('product-images')
+        .getPublicUrl(uploadData.path);
+      // Insert image record into product_images
+      const { error: imgErr } = await supabase
+        .from('product_images')
+        .insert([{
+          product_id: productId,
+          image_url: publicUrl,
+          storage_path: uploadData.path,
+          is_primary: i === 0  // mark first image as primary
+        }]);
+      if (imgErr) { console.error(imgErr); throw imgErr; }
+    }
+
+    // Show success toast
+    toast.success('Product and images saved successfully');
    ```

    - **Notes**: We ensure only `products` is inserted first. Then for each file we upload to the **`product-images` bucket**. We used a subfolder per product for organization (`product-images/{productId}/...`). The `getPublicUrl` call is per Supabase docs. We mark the first image as primary. Adjust variable names as needed.

- **Product Edit Component** (if exists): Similar changes as above, ensuring editing images goes through `product_images` only. Remove any attempt to update `products.image_url`.

- **Supabase Storage Bucket Name**: Ensure consistency. If the code originally used `'product_images'` or `'product-images'`, use the bucket name you have in Storage. (Supabase bucket names are exact.)

- **Backend API (if any)**: If you have a server-side API (Node/Express or Next.js API routes) that handles product creation, apply the same logic there. E.g. in `api/products/create.ts`:
  ```diff
  // After inserting product (getting id)
  for (const [i, file] of files.entries()) {
    const filePath = `product-images/${newProductId}/${Date.now()}-${file.originalname}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage.from('product-images').upload(filePath, file.buffer);
    // ...
    await supabase.from('product_images').insert({
      product_id: newProductId,
      image_url: publicUrl,
      storage_path: uploadData.path,
      is_primary: (i === 0)
    });
  }
  ```

- **Supabase Client and Types**: In `supabaseClient.ts` or similar, nothing changes aside from maybe defining the bucket. Check that the Storage bucket exists (e.g. “product-images” vs “product_images” as used in code). Also update any TypeScript types/interfaces:
  ```ts
  interface ProductImageInsert {
    product_id: string;
    image_url: string;
    storage_path: string;
    is_primary: boolean;
  }
  ```

- **UX Updates**: Ensure the form’s schema or validation expects multiple files (e.g. `<input type="file" multiple />`). After code change, the UI should not show any input for a single “image URL” – that field is removed.

## 5. Database Schema and SQL Updates  
We will modify the database *only after* the code changes above are confirmed working. The SQL changes are mainly **cleanup of legacy triggers/functions and adding constraints**:

1. **Drop Legacy Trigger/Function**:  
   The trigger on `product_images` is obsolete. Run:
   ```sql
   -- Remove the old sync trigger and function
   DROP TRIGGER IF EXISTS trg_sodfa_sync_product_primary_image ON public.product_images;
   DROP FUNCTION IF EXISTS public.sodfa_sync_product_primary_image();
   ```
   This ensures inserting images won’t error out. (Replace names if they differ; use `public.` schema if needed.)

2. **Add Constraint for One Primary Image** (optional but recommended):  
   To enforce that each product has at most one primary image:
   ```sql
   ALTER TABLE public.product_images
     ADD CONSTRAINT one_primary_image_per_product
     UNIQUE (product_id)
     WHERE is_primary = TRUE;
   ```
   This partial unique index is a best practice to avoid multiple `is_primary = true` for one product.

3. **Add `position` Column** (optional for ordering):  
   If you want to allow ordering beyond primary, you can add:
   ```sql
   ALTER TABLE public.product_images
     ADD COLUMN position INTEGER NOT NULL DEFAULT 1;
   ```
   Then you can set `position` manually when inserting or moving images.

4. **(Optional) Drop `products.image_url`**:  
   If by any chance an `image_url` column exists on `products` (the error suggests it doesn’t), drop it to avoid confusion:
   ```sql
   ALTER TABLE public.products
     DROP COLUMN IF EXISTS image_url;
   ```

5. **(Optional) Foreign Key and Indexes**:  
   Ensure `product_images.product_id` is indexed (should be if a foreign key). E.g.:
   ```sql
   ALTER TABLE public.product_images
     ADD CONSTRAINT fk_product
     FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
   CREATE INDEX ON public.product_images(product_id);
   ```

After running these SQL commands, the database will match the new design. **Only run these after deploying the code changes above**, and after verifying that products and images insert without the trigger conflict.

## 6. Testing and Rollback Plan  
**Test Cases**: We will verify with a suite of manual (or automated) tests:

- **Test 1: Create Product with No Images**  
  - Input: Fill product fields, no files selected.  
  - Expected: Product is created (a row in `products`), no rows in `product_images`, success toast shown.  
  - Verify: `SELECT * FROM products WHERE id = ...;` shows the product. `SELECT * FROM product_images WHERE product_id = ...;` returns 0 rows.

- **Test 2: Create Product with 1 Image**  
  - Input: Fill fields and attach one image file via file-picker or drag.  
  - Expected: Product is created, one file uploaded to Storage, one row in `product_images` with `is_primary = true`. Success toast.  
  - Verify: The image file appears in Supabase Storage under `product-images/{productId}/...`. `product_images` has 1 entry, with correct `image_url` and `is_primary = true`.

- **Test 3: Create Product with Multiple Images (2+)**  
  - Input: Fill fields and attach 2 or more image files.  
  - Expected: Product created, each file uploaded, multiple rows in `product_images`. First image is marked primary, others have `is_primary = false`. Success toast.  
  - Verify: All files in Storage, each `product_images` entry has the right URL and flags. The unique constraint (if added) passes.

- **Test 4: Update/Edit Product Images** (if supported)  
  - Input: On an existing product, upload additional images or change primary.  
  - Expected: New images added to `product_images`. If the user can change primary, ensure only one remains primary.  
  - Verify: Database reflects changes; no trigger errors.

- **Error Handling Tests**:  
  - Simulate upload failure (e.g. disconnect storage). Ensure the error is caught and does not leave orphan records. For example, if image upload fails, the product should not be partially inserted (you might implement transaction or manual cleanup).  
  - Test with invalid file type or too-large file; validation should prevent upload (referencing example code).

- **Rollback Plan**: In case of critical failure:
  1. **Code rollback**: Revert to previous code version. Since our database changes are DROP operations, they are not easily reversible. We should backup the DB before running SQL.  
  2. **Database rollback**: If needed, restore from backup or manually re-create the `sodfa_sync_product_primary_image` function and trigger (from version control or backup script).  
  3. **Storage cleanup**: If uploads occurred before a failure, manually delete leftover files from the bucket.

Perform these tests in a staging environment before going to production.

## 7. Comparison of Design Options  

| Aspect                            | Option A: Hybrid (products.image_url + product_images)      | Option B: `product_images`-only (recommended)            |
|-----------------------------------|-----------------------------------------------------------|----------------------------------------------------------|
| **Data Model**                    | `products` has one image column; `product_images` holds extras. | All images (including primary) in `product_images`.        |
| **Simplicity (code)**             | Complexity: need logic to use either `products.image_url` or `product_images`. | Simpler: always query `product_images`, no special case.   |
| **Consistency**                   | Hard to maintain if logic bugs; primary image stored twice. | Consistent: one source of truth, no redundancy.           |
| **Flexibility (multiple images)** | Limited: only one image fits in `products`; others in separate table. | Unlimited: naturally handles 0..N images per product.      |
| **Legacy compatibility**          | Might reuse some existing fields, but triggers needed (and failing). | Clean slate: drop legacy trigger, avoid confusion.        |
| **Database constraints**          | Harder to enforce (need triggers to sync primary).         | Easy: add a simple UNIQUE constraint on `(product_id, is_primary)`. |
| **Query simplicity**              | Fetch primary image from `products` fast (maybe one column). Others via join. | Always join `product_images` (but can index by primary flag). |
| **Citations / Best Practices**    | Generally not recommended to duplicate data.               | Aligns with normalized schema (see example in). |
| **Implementation effort**         | Must maintain both paths; our code already partially on `product_images`. | Code and schema already mostly on `product_images`; minimal changes. |
| **Recommendation**                | Not recommended: adds complexity for little gain.          | **Recommended**: one-to-many model is robust and scalable. |

In summary, **Option B** (all images in `product_images`) is simpler and more maintainable. The one‐table approach scales naturally to multiple images and avoids legacy trigger logic. We proceed with Option B.

## 8. Diagrams

**Upload Flowchart (simplified)**: Shows the sequence of actions from form submission to database inserts.  
```mermaid
flowchart TD
    Start[User fills form + selects images] --> CreateProduct[Insert into PRODUCTS]
    CreateProduct -->|get product_id| UploadImage1[Upload Image 1 to Storage]
    UploadImage1 --> URL1[Get public URL]
    URL1 --> DBImage1[Insert into PRODUCT_IMAGES (is_primary=true)]
    Start --> UploadImage2[Upload Image 2 to Storage]
    UploadImage2 --> URL2[Get public URL]
    URL2 --> DBImage2[Insert into PRODUCT_IMAGES (is_primary=false)]
    DBImage1 --> SuccessToast[Show Success Toast]
    DBImage2 --> SuccessToast
```

**Entity-Relationship Diagram**: Illustrates the one-to-many relationship.  
```mermaid
erDiagram
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has"
    PRODUCTS {
      uuid id "PK"
      text name
      text description
      numeric price
      ... other fields ...
    }
    PRODUCT_IMAGES {
      uuid id "PK"
      uuid product_id "FK to PRODUCTS.id"
      text image_url
      text storage_path
      bool is_primary
      int position "optional order"
    }
```

*(Above diagrams use Mermaid syntax for clarity. In implementation, PRODUCTS and PRODUCT_IMAGES are actual tables, with PRODUCT_IMAGES rows referencing PRODUCTS.)*

## 9. References

- The FrontKit e-commerce schema separates product images into a `product_images` table with fields `url`, `is_primary`, `position` (order), etc. This one-to-many pattern is the model we adopt.  
- Supabase documentation provides examples of uploading files and getting their URLs, as well as client-side validation of image files.  
- PostgreSQL trigger best practices: use a BEFORE trigger to modify the inserting row with `NEW.<col> = value; RETURN NEW;`. In our case, we eliminate the legacy AFTER trigger entirely.

