-- 0010_seed_menu.sql
-- Idempotent re-import of /lib/menu-data.ts into menu_categories +
-- menu_items. Re-running this is a no-op thanks to ON CONFLICT clauses on
-- the primary key (categories) and the unique (category_id, name)
-- constraint (items).
--
-- Prices in /lib/menu-data.ts are stored as rupees (e.g. price: 80); the
-- DB stores paise (1 INR = 100 paise) to match payment-provider.ts. This
-- migration multiplies every price by 100 inline.
--
-- After this runs, /lib/menu-repo.ts (server-only) is the new source of
-- truth and the storefront should NOT import /lib/menu-data.ts at runtime.
-- The TS file stays in the repo as the seed source — useful if you ever
-- need to re-bootstrap a fresh Supabase project.
--
-- Run AFTER 0009 in Supabase Studio → SQL editor.

-- ============================================================
-- Categories
-- ============================================================

insert into menu_categories (id, title, subtitle, sort_order) values
  ('soups',         'Soups',                       'A warm beginning to your meal',                  10),
  ('tandoor',       'Tandoor Snacks',              'From the live charcoal grill',                   20),
  ('rolls-momos',   'Rolls & Momos',               'Hand-rolled, freshly steamed',                   30),
  ('main-veg',      'Main Course — Vegetarian',    'Slow-cooked curries from our kitchen',           40),
  ('chicken',       'Chicken',                     'Choose Half or Full portion',                    50),
  ('mutton',        'Mutton',                      'Choose Half or Full portion',                    60),
  ('egg',           'Egg',                         null,                                             70),
  ('indo-chinese',  'Indo-Chinese',                'Gravies & noodles wok-tossed to order',          80),
  ('biryani-rice',  'Biryani & Rice',              'Long-grain basmati, slow-cooked',                90),
  ('dal',           'Dal',                         null,                                            100),
  ('breads',        'Breads',                      'Fresh from the tandoor',                        110),
  ('sides',         'Salads, Raita & Papad',       'The perfect accompaniments',                    120),
  ('beverages',     'Hot Beverages',               null,                                            130),
  ('mocktails',     'Mocktails',                   'Refreshing, artfully crafted',                  140),
  ('shakes',        'Shakes',                      'Thick, indulgent, and made fresh',              150)
on conflict (id) do nothing;

-- ============================================================
-- Items
-- Columns: category_id, name, price_single, price_half, price_full,
--          note, is_veg, sort_order
-- All prices in PAISE.
-- ============================================================

-- ---------- Soups ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('soups', 'Hot & Sour Veg Soup',       8000,  null, null, null, true,  10),
  ('soups', 'Veg Manchow Soup',          9000,  null, null, null, true,  20),
  ('soups', 'Lemon Coriander Soup',     11000,  null, null, null, true,  30),
  ('soups', 'Hot & Sour Chicken Soup',  11000,  null, null, null, false, 40),
  ('soups', 'Chicken Manchow Soup',     12000,  null, null, null, false, 50)
on conflict (category_id, name) do nothing;

-- ---------- Tandoor Snacks ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('tandoor', 'Paneer Achaari Tikka',   null, null, 19900, null, true,  10),
  ('tandoor', 'Paneer Tikka',           null, null, 19900, null, true,  20),
  ('tandoor', 'Paneer Hariyali Tikka',  null, null, 19900, null, true,  30),
  ('tandoor', 'Paneer Afghani Tikka',   null, null, 19900, null, true,  40),
  ('tandoor', 'Tandoori Soya Chaap',    null, null, 19900, null, true,  50),
  ('tandoor', 'Afghani Chaap',          null, null, 19900, null, true,  60),
  ('tandoor', 'Mushroom Tikka',         null, null, 21000, null, true,  70),
  ('tandoor', 'Chicken Tikka',          null, null, 25000, null, false, 80),
  ('tandoor', 'Lemon Chicken Tikka',    null, null, 25000, null, false, 90),
  ('tandoor', 'Achari Chicken Tikka',   null, null, 23900, null, false, 100),
  ('tandoor', 'Tandoori Chicken',       null, 32000, 59900, null, false, 110)
on conflict (category_id, name) do nothing;

-- ---------- Rolls & Momos ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('rolls-momos', 'Veg Roll',          9900,  null, null, null, true,  10),
  ('rolls-momos', 'Paneer Roll',      13000,  null, null, null, true,  20),
  ('rolls-momos', 'Egg Roll',         15000,  null, null, null, false, 30),
  ('rolls-momos', 'Chicken Roll',     17900,  null, null, null, false, 40),
  ('rolls-momos', 'Veg Momos',         9900,  null, null, null, true,  50),
  ('rolls-momos', 'Paneer Momos',     11100,  null, null, null, true,  60),
  ('rolls-momos', 'Sweet Corn Momos', 13900,  null, null, null, true,  70),
  ('rolls-momos', 'Chicken Momos',    14900,  null, null, null, false, 80)
on conflict (category_id, name) do nothing;

-- ---------- Main Course — Vegetarian ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('main-veg', 'Paneer Bhuna Masala',     19900, null, null, null, true,  10),
  ('main-veg', 'Paneer Masala',           19900, null, null, null, true,  20),
  ('main-veg', 'Paneer Do Pyaza',         19900, null, null, null, true,  30),
  ('main-veg', 'Paneer Butter Masala',    21000, null, null, null, true,  40),
  ('main-veg', 'Paneer Tikka Masala',     22000, null, null, null, true,  50),
  ('main-veg', 'Shahi Paneer',            24000, null, null, null, true,  60),
  ('main-veg', 'Paneer Kadhi',            19900, null, null, null, true,  70),
  ('main-veg', 'Paneer Chatpatta',        19900, null, null, null, true,  80),
  ('main-veg', 'Paneer Lababdar',         19900, null, null, null, true,  90),
  ('main-veg', 'Matar Paneer',            19900, null, null, null, true, 100),
  ('main-veg', 'Paneer Baby Corn Masala', 24000, null, null, null, true, 110),
  ('main-veg', 'Matar Methi Malai',       19900, null, null, null, true, 120),
  ('main-veg', 'Malai Kofta',             24000, null, null, null, true, 130),
  ('main-veg', 'Veg Kofta',               18000, null, null, null, true, 140),
  ('main-veg', 'Mix Veg',                 15000, null, null, null, true, 150),
  ('main-veg', 'Veg Makhan Wala',         19900, null, null, null, true, 160),
  ('main-veg', 'Mushroom Masala',         19900, null, null, null, true, 170),
  ('main-veg', 'Mushroom Kadhai',         19900, null, null, null, true, 180),
  ('main-veg', 'Mushroom Do Pyaza',       19900, null, null, null, true, 190),
  ('main-veg', 'Soya Chaap Masala',       19000, null, null, null, true, 200),
  ('main-veg', 'Kadhai Chaap Masala',     19000, null, null, null, true, 210),
  ('main-veg', 'Chaap Butter Masala',     19000, null, null, null, true, 220),
  ('main-veg', 'Chaap Do Pyaza',          19000, null, null, null, true, 230)
on conflict (category_id, name) do nothing;

-- ---------- Chicken (half + full) ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('chicken', 'Chicken Butter Masala',   null, 17500, 29000, null, false,  10),
  ('chicken', 'Murg Mussallam',          null, 22000, 39000, null, false,  20),
  ('chicken', 'Chicken Do Pyaza',        null, 18000, 29000, null, false,  30),
  ('chicken', 'Chicken Kadhai',          null, 20000, 32000, null, false,  40),
  ('chicken', 'Chicken Curry',           null, 17500, 29000, null, false,  50),
  ('chicken', 'Chicken Lababdar',        null, 17500, 29000, null, false,  60),
  ('chicken', 'Chicken Rara',            null, 22000, 39000, null, false,  70),
  ('chicken', 'Chicken Keema',           null, null,  20000, null, false,  80),
  ('chicken', 'Chicken Kosa',            null, 17500, 29000, null, false,  90),
  ('chicken', 'Chicken Stew',            null, 17500, 29000, null, false, 100),
  ('chicken', 'Chicken Masala',          null, 19000, 32000, null, false, 110),
  ('chicken', 'Chicken Korma',           null, 19000, 32000, null, false, 120),
  ('chicken', 'Chicken Chatkara',        null, 19000, 32000, null, false, 130),
  ('chicken', 'Chicken Handi',           null, 19000, 32000, null, false, 140),
  ('chicken', 'Chicken Tikka Masala',    null, 19000, 32000, null, false, 150)
on conflict (category_id, name) do nothing;

-- ---------- Mutton (half + full) ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('mutton', 'Mutton Rogan Josh',     null, 26000, 42000, null, false, 10),
  ('mutton', 'Mutton Bhunna Masala',  null, 23000, 40000, null, false, 20),
  ('mutton', 'Dehati Mutton',         null, 20000, 39000, null, false, 30)
on conflict (category_id, name) do nothing;

-- ---------- Egg ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('egg', 'Egg Curry',     11000, null, null, '2 pcs', false, 10),
  ('egg', 'Egg Masala',    12000, null, null, '2 pcs', false, 20),
  ('egg', 'Egg Do Pyaza',  14000, null, null, '2 pcs', false, 30)
on conflict (category_id, name) do nothing;

-- ---------- Indo-Chinese ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('indo-chinese', 'Veg Manchurian Gravy',         16000, null, null, null,    true,   10),
  ('indo-chinese', 'Paneer Chilli Gravy',          18000, null, null, null,    true,   20),
  ('indo-chinese', 'Paneer Manchurian Gravy',      19000, null, null, null,    true,   30),
  ('indo-chinese', 'Mushroom Chilli Gravy',        19900, null, null, null,    true,   40),
  ('indo-chinese', 'Veg Hakka Noodles',             9900, null, null, null,    true,   50),
  ('indo-chinese', 'Veg Chowmein',                  9500, null, null, null,    true,   60),
  ('indo-chinese', 'Chilli Garlic Veg Noodles',     9900, null, null, null,    true,   70),
  ('indo-chinese', 'Egg Noodles',                  12000, null, null, null,    false,  80),
  ('indo-chinese', 'Chicken Noodles',              12000, null, null, null,    false,  90),
  ('indo-chinese', 'Chicken Hakka Noodles',        13000, null, null, null,    false, 100),
  ('indo-chinese', 'Chicken Garlic Noodles',       13000, null, null, null,    false, 110),
  ('indo-chinese', 'Chicken Schezwan Gravy',       19000, null, null, null,    false, 120),
  ('indo-chinese', 'Black Pepper Chicken Gravy',   19000, null, null, null,    false, 130),
  ('indo-chinese', 'Chicken Chilli Boneless Gravy',22500, null, null, null,    false, 140),
  ('indo-chinese', 'Garlic Chicken Gravy',         21000, null, null, null,    false, 150),
  ('indo-chinese', 'Chicken Lollipop',             29900, null, null, '6 pcs', false, 160)
on conflict (category_id, name) do nothing;

-- ---------- Biryani & Rice ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('biryani-rice', 'Steam Rice',                    8000,  null, null, null,    true,   10),
  ('biryani-rice', 'Jeera Rice',                   10000,  null, null, null,    true,   20),
  ('biryani-rice', 'Ghee Rice',                    12000,  null, null, null,    true,   30),
  ('biryani-rice', 'Veg Fry Rice',                 14000,  null, null, null,    true,   40),
  ('biryani-rice', 'Paneer Fry Rice',              14000,  null, null, null,    true,   50),
  ('biryani-rice', 'Kashmiri Pulao',               14000,  null, null, null,    true,   60),
  ('biryani-rice', 'Paneer Pulao',                 14000,  null, null, null,    true,   70),
  ('biryani-rice', 'Veg Biryani',                  16000,  null, null, null,    true,   80),
  ('biryani-rice', 'Paneer Veg Biryani',           17000,  null, null, null,    true,   90),
  ('biryani-rice', 'Egg Fried Rice',               12000,  null, null, null,    false, 100),
  ('biryani-rice', 'Egg Biryani',                  13000,  null, null, '2 eggs',false, 110),
  ('biryani-rice', 'Chicken Fried Rice',           17000,  null, null, null,    false, 120),
  ('biryani-rice', 'Chicken Garlic Fried Rice',    17000,  null, null, null,    false, 130),
  ('biryani-rice', 'Chicken Mushroom Fried Rice',  18000,  null, null, null,    false, 140),
  ('biryani-rice', 'Chicken Biryani',              18000,  null, null, '2 pcs', false, 150),
  ('biryani-rice', 'Chicken Hyderabadi Biryani',   24000,  null, null, '2 pcs', false, 160),
  ('biryani-rice', 'Mutton Biryani',               24000,  null, null, '2 pcs', false, 170)
on conflict (category_id, name) do nothing;

-- ---------- Dal ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('dal', 'Dal Fry',           12000, null, null, null, true, 10),
  ('dal', 'Dal Tadka',         14000, null, null, null, true, 20),
  ('dal', 'Dal Punjabi Tadka', 12000, null, null, null, true, 30),
  ('dal', 'Dal Makhani',       17000, null, null, null, true, 40)
on conflict (category_id, name) do nothing;

-- ---------- Breads ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('breads', 'Tawa Roti',                    1500, null, null, null, true,   10),
  ('breads', 'Tandoori Roti',                2500, null, null, null, true,   20),
  ('breads', 'Butter Tandoori Roti',         3000, null, null, null, true,   30),
  ('breads', 'Mirchi Butter Tandoori Roti',  3000, null, null, null, true,   40),
  ('breads', 'Roomali Roti',                 3000, null, null, null, true,   50),
  ('breads', 'Plain Naan',                   4000, null, null, null, true,   60),
  ('breads', 'Butter Naan',                  4000, null, null, null, true,   70),
  ('breads', 'Lacha Paratha',                4000, null, null, null, true,   80),
  ('breads', 'Garlic Naan',                  5000, null, null, null, true,   90),
  ('breads', 'Aloo Paratha',                 5000, null, null, null, true,  100),
  ('breads', 'Sattu Paratha',                5000, null, null, null, true,  110),
  ('breads', 'Paneer Paratha',               7000, null, null, null, true,  120),
  ('breads', 'Chicken Keema Naan',          10000, null, null, null, false, 130)
on conflict (category_id, name) do nothing;

-- ---------- Salads, Raita & Papad ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('sides', 'Green Salad',    5000, null, null, null, true, 10),
  ('sides', 'Family Salad',   8000, null, null, null, true, 20),
  ('sides', 'Veg Raita',      5000, null, null, null, true, 30),
  ('sides', 'Boondi Raita',   5000, null, null, null, true, 40),
  ('sides', 'Roasted Papad',  2000, null, null, null, true, 50),
  ('sides', 'Masala Papad',   2000, null, null, null, true, 60),
  ('sides', 'Fried Papad',    4000, null, null, null, true, 70)
on conflict (category_id, name) do nothing;

-- ---------- Hot Beverages ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('beverages', 'Tea',     4000, null, null, null, true, 10),
  ('beverages', 'Coffee',  5000, null, null, null, true, 20)
on conflict (category_id, name) do nothing;

-- ---------- Mocktails ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('mocktails', 'Mint Mojito',         12500, null, null, null, true, 10),
  ('mocktails', 'Green Mint Mojito',   13500, null, null, null, true, 20),
  ('mocktails', 'Green Apple Mojito',  14000, null, null, null, true, 30),
  ('mocktails', 'Blue Sky',            13000, null, null, null, true, 40),
  ('mocktails', 'Watermelon Cooler',   12900, null, null, null, true, 50),
  ('mocktails', 'Piña Colada',         15000, null, null, null, true, 60)
on conflict (category_id, name) do nothing;

-- ---------- Shakes ----------
insert into menu_items (category_id, name, price_single, price_half, price_full, note, is_veg, sort_order) values
  ('shakes', 'Strawberry Shake',   11000, null, null, null, true, 10),
  ('shakes', 'Butterscotch Shake', 12000, null, null, null, true, 20),
  ('shakes', 'Mango Shake',        13000, null, null, null, true, 30),
  ('shakes', 'Pineapple Shake',    13000, null, null, null, true, 40),
  ('shakes', 'Oreo Shake',         13500, null, null, null, true, 50),
  ('shakes', 'Kiwi Shake',         14000, null, null, null, true, 60),
  ('shakes', 'KitKat Shake',       14000, null, null, null, true, 70),
  ('shakes', 'Banana Shake',       16000, null, null, null, true, 80),
  ('shakes', 'Shehnai Special',    12500, null, null, null, true, 90)
on conflict (category_id, name) do nothing;

-- ============================================================
-- Sanity check (run separately if you want to verify):
--
--   select c.id, c.title, count(i.id) as items
--     from menu_categories c
--     left join menu_items i on i.category_id = c.id
--    group by c.id, c.title, c.sort_order
--    order by c.sort_order;
--
-- Expected total: 142 items across 15 categories.
--   soups 5 · tandoor 11 · rolls-momos 8 · main-veg 23 · chicken 15 ·
--   mutton 3 · egg 3 · indo-chinese 16 · biryani-rice 17 · dal 4 ·
--   breads 13 · sides 7 · beverages 2 · mocktails 6 · shakes 9
-- ============================================================
