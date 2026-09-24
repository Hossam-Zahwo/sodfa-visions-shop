# SODFA Categories + Keywords

## 1. Database
Run `supabase_categories_keywords.sql` completely in the Supabase SQL Editor.

The migration:
- keeps the existing `categories` table;
- creates `category_keywords`;
- adds `products.keywords`;
- automatically copies a product's selected category keywords into `products.keywords`;
- refreshes existing products when category keywords are changed;
- adds admin-only RLS policies for `category_keywords`.

## 2. Frontend dependency
The Categories page supports `.xlsx`, `.xls`, and `.csv` through SheetJS.

From the project root run:

```bash
npm install xlsx
```

Then run your normal build/dev commands.

## 3. Excel import
The first sheet should contain two columns:

| category | keyword |
|---|---|
| أكواب | كوب |
| أكواب | مج |
| جرابات iPhone | جراب ايفون |

Arabic headers are also accepted:
- `التصنيف`
- `الكلمات المفتاحية`

Multiple keywords can also be placed in one cell separated by comma, Arabic comma, semicolon, `|`, or a new line.

If the category already exists, imported keywords are appended without duplicates.
If it does not exist, the page creates it and adds the keywords.

## 4. Product behavior
In لوحة التحكم > المنتجات, selecting a category immediately displays its keywords.
On save, Supabase automatically writes those keywords into `products.keywords`.
Changing the category updates the product keywords automatically.
Changing a category's keywords also refreshes the keywords of all products assigned to that category.
